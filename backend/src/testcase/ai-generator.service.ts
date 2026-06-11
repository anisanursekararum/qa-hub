import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CaseStatus, CasePriority } from '@prisma/client';
import pdf = require('pdf-parse');
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AiGeneratorService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey || '');
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
      let pdfText = '';
      try {
        const parsedPdf = await pdf(pdfBuffer);
        pdfText = parsedPdf.text;
      } catch (error: any) {
        throw new BadRequestException(`Failed to extract text from PDF: ${error.message}`);
      }

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

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

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

      let generatedCasesJson: any[];
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        generatedCasesJson = JSON.parse(responseText);
      } catch (error: any) {
        throw new InternalServerErrorException(`Google Gemini API generation or JSON parsing failed: ${error.message}`);
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
