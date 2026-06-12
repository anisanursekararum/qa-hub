import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CaseStatus, CasePriority } from '@prisma/client';
import { PdfParserService } from './pdf-parser.service';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
  backoffFactor = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || '';
    const isQuotaExceeded = errorMsg.includes('exceeded your current quota') ||
                            errorMsg.includes('Quota exceeded') ||
                            errorMsg.includes('QuotaFailure');
    const isTransient = !isQuotaExceeded && (
                        errorMsg.includes('503') || 
                        errorMsg.includes('Service Unavailable') || 
                        errorMsg.includes('429') || 
                        errorMsg.includes('Too Many Requests') ||
                        errorMsg.includes('experiencing high demand') ||
                        errorMsg.includes('fetch failed') ||
                        errorMsg.includes('ETIMEDOUT') ||
                        errorMsg.includes('ECONNRESET') ||
                        errorMsg.includes('socket hang up')
    );
    if (retries > 0 && isTransient) {
      console.warn(`Transient Gemini API/network error: ${errorMsg}. Retrying in ${delayMs}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return retryWithBackoff(fn, retries - 1, delayMs * backoffFactor, backoffFactor);
    }
    throw error;
  }
}

@Injectable()
export class AiGeneratorService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfParserService: PdfParserService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  private async generateWithDeepSeek(prompt: string, jsonSchema: any): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured.');
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert Senior Quality Engineering Manager. You must strictly output your response as a valid JSON object matching this schema: ${JSON.stringify(jsonSchema)}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: {
          type: 'json_object'
        },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: any = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Generates test cases from a PDF file, validates and inserts them to the database.
   */
  async generateTestCasesFromPdf(
    projectId: string,
    userId: string,
    pdfBuffer: Buffer,
    fileName: string,
  ) {
    if (!process.env.GEMINI_API_KEY) {
      throw new BadRequestException('GEMINI_API_KEY is not configured in the backend environment.');
    }

    let status = 'SUCCESS';
    let rowCount = 0;

    try {
      // 1. PDF Text Extraction
      const pdfText = await this.pdfParserService.extractText(pdfBuffer);

      if (!pdfText || pdfText.trim().length === 0) {
        throw new BadRequestException('The uploaded PDF does not contain any extractable plain text.');
      }

      // 2. LLM Schema Enforcement
      const schema: Schema = {
        type: SchemaType.ARRAY,
        description: 'A list of generated test cases based on the PRD specification.',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: {
              type: SchemaType.STRING,
              description: 'Descriptive test case title representing a specific scenario (e.g. "Verify login with valid credentials").',
            },
            moduleName: {
              type: SchemaType.STRING,
              description: 'The user-friendly name of the functional module (e.g., "User Authentication").',
            },
            moduleCode: {
              type: SchemaType.STRING,
              description: 'A 2-5 letter uppercase code for the module (e.g., "AUTH").',
            },
            prerequisite: {
              type: SchemaType.STRING,
              description: 'Prerequisites/pre-conditions needed before running the test steps.',
            },
            steps: {
              type: SchemaType.STRING,
              description: 'Sequential, clear test steps (e.g. numbered list like "1. Navigate to /login\\n2. Enter credentials").',
            },
            expectedResult: {
              type: SchemaType.STRING,
              description: 'Expected result/behavior after executing all steps.',
            },
            priority: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['HIGH', 'MEDIUM', 'LOW'],
              description: 'Risk-based priority level.',
            },
          },
          required: ['title', 'moduleName', 'moduleCode', 'steps', 'expectedResult', 'priority'],
        },
      };

      // Helper to read workspace files safely
      const readFileContent = (filename: string): string => {
        const pathsToTry = [
          path.resolve(process.cwd(), '..', filename),
          path.resolve(process.cwd(), filename),
        ];
        for (const p of pathsToTry) {
          if (fs.existsSync(p)) {
            try {
              return fs.readFileSync(p, 'utf8');
            } catch (err) {
              console.error(`Failed to read file ${p}:`, err);
            }
          }
        }
        return '';
      };

      const prdContent = readFileContent('prd.md');
      const standardContent = readFileContent('standard.md');
      const instructionContent = readFileContent('instruction.md');

      const prompt = `
        You are a Senior Quality Engineering Manager.
        
        Please generate test cases based on the instructions, standards, and references below:
        
        --- COWORK INSTRUCTIONS (instruction.md) ---
        ${instructionContent || 'No instruction.md found.'}
        
        --- TESTING PROCESS STANDARD (standard.md) ---
        ${standardContent || 'No standard.md found.'}
        
        --- PRODUCT REQUIREMENT DOCUMENT REFERENCE (prd.md) ---
        ${prdContent || 'No prd.md found.'}
        
        --- UPLOADED SPECIFICATION DOCUMENT (PDF to ingest) ---
        ${pdfText}
        
        Analyze the uploaded PDF document and generate test cases.
        You must strictly adhere to the guidelines in the Cowork Instructions and Testing Process Standard.
        Ensure you cover both happy paths and negative/edge case scenarios as per the testing standards.
        For each test case, extract the functional module (moduleName and 2-5 letter uppercase code moduleCode) and provide a descriptive title, prerequisite, clear steps, expected results, and a suitable priority (HIGH, MEDIUM, or LOW).
      `;

      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-flash-latest'
      ];

      let generatedCasesJson: any[] = [];
      let success = false;
      let lastError: any = null;

      // Try DeepSeek first if configured
      if (process.env.DEEPSEEK_API_KEY) {
        try {
          console.log('Using DeepSeek for text generation...');
          const resultText = await retryWithBackoff(() => this.generateWithDeepSeek(prompt, schema));
          generatedCasesJson = JSON.parse(resultText);
          success = true;
        } catch (error: any) {
          console.warn(`DeepSeek generation failed, falling back to Gemini: ${error.message || error}`);
          lastError = error;
        }
      }

      // Fallback to Gemini if DeepSeek is not configured or failed
      if (!success) {
        console.log('Using Gemini for text generation...');
        for (const modelName of modelsToTry) {
          try {
            const model = this.genAI.getGenerativeModel({
              model: modelName,
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: schema,
              },
            });
            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const responseText = result.response.text();
            generatedCasesJson = JSON.parse(responseText);
            success = true;
            break;
          } catch (error: any) {
            const errorMsg = error?.message || '';
            const isQuotaExceeded = errorMsg.includes('exceeded your current quota') ||
                                    errorMsg.includes('Quota exceeded') ||
                                    errorMsg.includes('QuotaFailure');
            if (isQuotaExceeded) {
              throw error;
            }
            console.warn(`Model ${modelName} failed in generateTestCasesFromPdf, trying next: ${errorMsg}`);
            lastError = error;
          }
        }
      }

      if (!success) {
        throw new InternalServerErrorException(
          `AI generation or JSON parsing failed: ${lastError?.message || lastError}`
        );
      }

      if (!Array.isArray(generatedCasesJson)) {
        throw new InternalServerErrorException('AI did not return a valid array of test cases.');
      }

      // 3. Database Insertion (Staging Gate)
      const createdTestCases = [];

      // Process sequentially to safely update module sequences and generate publicIds
      for (const item of generatedCasesJson) {
        const cleanModuleCode = (item.moduleCode || 'GEN')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 5);

        const cleanModuleName = item.moduleName || 'Generated Module';

        // Find or create module for this project
        let module = await this.prisma.projectModule.findFirst({
          where: { projectId, code: cleanModuleCode },
        });

        if (!module) {
          module = await this.prisma.projectModule.create({
            data: {
              projectId,
              name: cleanModuleName,
              code: cleanModuleCode,
            },
          });
        }

        // Increment sequence atomically
        const updatedModule = await this.prisma.projectModule.update({
          where: { id: module.id },
          data: { currentSequence: { increment: 1 } },
        });

        // Generate public ID (e.g. TC-AUTH-001)
        const publicId = `TC-${updatedModule.code}-${String(updatedModule.currentSequence).padStart(3, '0')}`;

        // Map priority to CasePriority enum
        let dbPriority: CasePriority = CasePriority.MEDIUM;
        if (item.priority === 'HIGH') {
          dbPriority = CasePriority.HIGH;
        } else if (item.priority === 'LOW') {
          dbPriority = CasePriority.LOW;
        }

        // Save into the database
        const createdCase = await this.prisma.testCase.create({
          data: {
            projectId,
            publicId,
            title: item.title,
            moduleId: updatedModule.id,
            prerequisite: item.prerequisite || null,
            steps: JSON.stringify([{ step: item.steps }]),
            expectedResult: item.expectedResult || null,
            hasAutomation: false, // defaulted to false
            status: CaseStatus.DRAFT, // staging gate: initialized with DRAFT
            priority: dbPriority,
            createdById: userId,
            updatedById: userId,
          },
          include: {
            module: true,
            createdBy: {
              select: { name: true, email: true },
            },
            updatedBy: {
              select: { name: true, email: true },
            },
          },
        });

        createdTestCases.push(createdCase);
      }

      rowCount = createdTestCases.length;
      return createdTestCases;
    } catch (error: any) {
      status = 'FAILED';
      throw error;
    } finally {
      // Record history
      await this.prisma.prdImportHistory.create({
        data: {
          projectId,
          fileName,
          rowCount,
          uploadedById: userId,
          status,
        },
      });
    }
  }
}
