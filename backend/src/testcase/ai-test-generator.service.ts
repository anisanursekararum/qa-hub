import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CaseStatus, CasePriority } from '@prisma/client';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

@Injectable()
export class AiTestGeneratorService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  /**
   * Generates embedding for a text chunk and pads/slices to 1536 dimensions.
   */
  async getEmbedding(text: string): Promise<number[]> {
    if (!process.env.GEMINI_API_KEY) {
      throw new BadRequestException('GEMINI_API_KEY is not configured in the backend environment.');
    }
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
      const result = await model.embedContent(text);
      const values = result.embedding.values;
      
      // Pad with zeros to 1536 dimensions to match schema.prisma vector(1536) constraint
      if (values.length < 1536) {
        const padding = new Array(1536 - values.length).fill(0);
        return [...values, ...padding];
      }
      return values.slice(0, 1536);
    } catch (error: any) {
      console.error('Failed to generate embedding:', error);
      // Fallback: return a zero vector of 1536 dims if embedding fails
      return new Array(1536).fill(0);
    }
  }

  /**
   * Helper to create a new test case in the database with custom sequential ID and generate/save its embedding.
   */
  private async createNewCase(projectId: string, userId: string, item: any): Promise<any> {
    const cleanModuleCode = (item.moduleCode || 'GEN')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 5);

    const cleanModuleName = item.moduleName || 'Generated Module';

    let module = await this.prisma.projectModule.findFirst({
      where: { projectId, code: cleanModuleCode },
    });

    if (!module) {
      module = await this.prisma.projectModule.create({
        data: { projectId, name: cleanModuleName, code: cleanModuleCode },
      });
    }

    const updatedModule = await this.prisma.projectModule.update({
      where: { id: module.id },
      data: { currentSequence: { increment: 1 } },
    });

    const publicId = `TC-${updatedModule.code}-${String(updatedModule.currentSequence).padStart(3, '0')}`;

    let dbPriority: CasePriority = CasePriority.MEDIUM;
    if (item.priority === 'HIGH') dbPriority = CasePriority.HIGH;
    if (item.priority === 'LOW') dbPriority = CasePriority.LOW;

    const createdCase = await this.prisma.testCase.create({
      data: {
        projectId,
        publicId,
        title: item.title,
        moduleId: updatedModule.id,
        prerequisite: item.prerequisite || null,
        steps: JSON.stringify([{ step: item.steps }]),
        expectedResult: item.expectedResult || null,
        status: CaseStatus.DRAFT,
        priority: dbPriority,
        notes: item.notes || null,
        createdById: userId,
        updatedById: userId,
        createdVia: 'AI_GENERATED',
      },
    });

    // Generate and save embedding for the new test case
    const textToEmbed = `${item.title} ${item.prerequisite || ''} ${item.steps} ${item.expectedResult || ''}`;
    const embedding = await this.getEmbedding(textToEmbed);
    const embeddingStr = `[${embedding.join(',')}]`;
    
    await this.prisma.$executeRawUnsafe(
      `UPDATE "TestCase" SET embedding = $1::vector WHERE id = $2`,
      embeddingStr,
      createdCase.id
    );

    return createdCase;
  }

  /**
   * Processes a single PRD text chunk to either create, modify, or keep test cases.
   * Supports generating multiple test cases per chunk (e.g. happy paths + negative scenarios).
   */
  async processPrdChunk(projectId: string, userId: string, prdChunk: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new BadRequestException('GEMINI_API_KEY is not configured.');
    }

    // 1. Generate embedding for the PRD chunk
    const prdEmbedding = await this.getEmbedding(prdChunk);
    const prdEmbeddingStr = `[${prdEmbedding.join(',')}]`;

    // 2. Find the top 5 closest test cases using cosine distance similarity
    const closestCases: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id, title, "projectId", "publicId", "moduleId", prerequisite, steps, "expectedResult", priority, notes
      FROM "TestCase"
      WHERE "projectId" = $1 AND embedding IS NOT NULL
      ORDER BY embedding <=> $2::vector
      LIMIT 5
    `, projectId, prdEmbeddingStr);

    // 3. Setup closest cases context for the prompt
    let oldTestCaseContext = 'None found.';
    if (closestCases && closestCases.length > 0) {
      oldTestCaseContext = closestCases
        .map(
          (c, idx) =>
            `${idx + 1}. ID: "${c.id}"\n   Public ID: "${c.publicId}"\n   Title: "${c.title}"\n   Prerequisite: "${c.prerequisite || ''}"\n   Steps: "${c.steps}"\n   Expected Result: "${c.expectedResult || ''}"\n   Priority: "${c.priority}"\n   Notes: "${c.notes || ''}"`
        )
        .join('\n\n---\n\n');
    }

    // 4. Send chunk + closest cases to Gemini with multiple actions schema
    const schema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        actions: {
          type: SchemaType.ARRAY,
          description: 'List of test case actions to perform based on the requirements in this PRD chunk. You must generate both happy path and failure/negative scenarios.',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              status: {
                type: SchemaType.STRING,
                enum: ['NEW', 'MODIFIED', 'UNCHANGED'],
                format: 'enum',
                description: 'Action for this test case scenario. NEW to create a brand new case, MODIFIED to update a closest case, UNCHANGED if already fully covered.',
              },
              closestTestCaseId: {
                type: SchemaType.STRING,
                description: 'For MODIFIED or UNCHANGED status, specify the exact ID of the closest test case matching this scenario. Leave empty/omit for NEW.',
              },
              reason: {
                type: SchemaType.STRING,
                description: 'Explanation for this choice.',
              },
              testCase: {
                type: SchemaType.OBJECT,
                description: 'The test case details. Required if status is NEW or MODIFIED.',
                properties: {
                  title: {
                    type: SchemaType.STRING,
                    description: 'Scenario-specific title. E.g. "Verify successful multi-factor login" or "Verify login failure with invalid PIN".',
                  },
                  moduleName: {
                    type: SchemaType.STRING,
                    description: 'Functional module name.',
                  },
                  moduleCode: {
                    type: SchemaType.STRING,
                    description: '2-5 letter uppercase module code (e.g. AUTH).',
                  },
                  prerequisite: {
                    type: SchemaType.STRING,
                    description: 'Pre-conditions.',
                  },
                  steps: {
                    type: SchemaType.STRING,
                    description: 'Sequential, numbered test steps (e.g. "1. Step one\\n2. Step two").',
                  },
                  expectedResult: {
                    type: SchemaType.STRING,
                    description: 'Expected result.',
                  },
                  priority: {
                    type: SchemaType.STRING,
                    enum: ['HIGH', 'MEDIUM', 'LOW'],
                    format: 'enum',
                    description: 'Priority based on risk.',
                  },
                  notes: {
                    type: SchemaType.STRING,
                    description: 'Additional notes.',
                  },
                },
                required: ['title', 'moduleName', 'moduleCode', 'steps', 'expectedResult', 'priority'],
              },
            },
            required: ['status', 'reason'],
          },
        },
      },
      required: ['actions'],
    };

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const prompt = `
      You are an expert Senior Quality Engineering Manager.
      
      Your goal is to ensure end-to-end quality and risk-based test coverage by generating test cases for the functional specifications described in the PRD Text Chunk.
      
      Compare the following PRD Text Chunk with the Closest Existing Test Cases in our database.
      
      --- PRD TEXT CHUNK ---
      ${prdChunk}
      
      --- CLOSEST EXISTING TEST CASES ---
      ${oldTestCaseContext}
      
      --- TESTING STANDARDS & RULES ---
      1. Happy Path & Failure Scenarios: For each requirement described in the PRD chunk, you MUST consider both happy path scenarios and failure/negative/edge-case scenarios (e.g. invalid inputs, barcode scan mismatches, unauthorized access).
      2. No duplicates: Do NOT create new test cases if an existing test case from the list already fully and accurately covers that specific scenario. In that case, either update it (status: "MODIFIED") if it lacks details/steps, or do not return it (or mark as "UNCHANGED").
      3. Priority Guidelines:
         - HIGH: Core happy paths, login, security (SSO/MFA, RBAC, session timeout), and critical transaction flows (verifying item UPC/SKU, location scan).
         - MEDIUM: Edge cases, error handling, shortages, and standard operational exceptions.
         - LOW: Volumetric recommendations, performance checks, cosmetic UI/UX guidelines, or offline sync options.
      4. Formatting:
         - Title: Clear, descriptive, and scenario-specific. E.g. "Verify successful Multi-Factor login on mobile PDA" or "Verify error alert and lock state on packing quantity mismatch".
         - Steps: Sequential, clear, numbered steps (e.g., "1. Log in to WMS Admin...\\n2. Navigate to...").
         - Expected Result: Clear expected result showing the system's reaction for the steps.
      5. Scope check: If the PRD chunk contains only introductory text, general objectives, personas, or KPIs without specific testable functional requirements, you MUST return a status of "UNCHANGED" with a reason.
      
      Provide the output strictly conforming to the requested JSON schema.
    `;

    let generatedJson: any;
    try {
      const result = await model.generateContent(prompt);
      generatedJson = JSON.parse(result.response.text());
    } catch (error: any) {
      throw new InternalServerErrorException(`Gemini generation or JSON parse failed: ${error.message}`);
    }

    const actions = generatedJson.actions || [];
    let newCount = 0;
    let modifiedCount = 0;
    const processedCases = [];

    for (const actionItem of actions) {
      const status = actionItem.status;
      const item = actionItem.testCase;
      const closestId = actionItem.closestTestCaseId;

      if (status === 'NEW' && item) {
        const createdCase = await this.createNewCase(projectId, userId, item);
        newCount++;
        processedCases.push({ action: 'NEW', testCase: createdCase, reason: actionItem.reason });
      } 
      
      else if (status === 'MODIFIED' && item) {
        let oldCaseExists = false;
        if (closestId) {
          const oldCase = await this.prisma.testCase.findUnique({
            where: { id: closestId },
          });
          if (oldCase) {
            oldCaseExists = true;
          }
        }

        if (oldCaseExists && closestId) {
          let dbPriority: CasePriority = CasePriority.MEDIUM;
          if (item.priority === 'HIGH') dbPriority = CasePriority.HIGH;
          if (item.priority === 'LOW') dbPriority = CasePriority.LOW;

          const updatedCase = await this.prisma.testCase.update({
            where: { id: closestId },
            data: {
              title: item.title,
              prerequisite: item.prerequisite || null,
              steps: JSON.stringify([{ step: item.steps }]),
              expectedResult: item.expectedResult || null,
              priority: dbPriority,
              notes: item.notes || null,
              updatedById: userId,
            },
          });

          // Generate and save new embedding
          const textToEmbed = `${item.title} ${item.prerequisite || ''} ${item.steps} ${item.expectedResult || ''}`;
          const embedding = await this.getEmbedding(textToEmbed);
          const embeddingStr = `[${embedding.join(',')}]`;
          
          await this.prisma.$executeRawUnsafe(
            `UPDATE "TestCase" SET embedding = $1::vector WHERE id = $2`,
            embeddingStr,
            updatedCase.id
          );

          modifiedCount++;
          processedCases.push({ action: 'MODIFIED', testCase: updatedCase, reason: actionItem.reason });
        } else {
          // Fallback to creating a new case if ID is not found or empty
          const createdCase = await this.createNewCase(projectId, userId, item);
          newCount++;
          processedCases.push({ action: 'NEW', testCase: createdCase, reason: actionItem.reason });
        }
      }
    }

    return {
      action: newCount > 0 && modifiedCount > 0 ? 'MIXED' : newCount > 0 ? 'NEW' : modifiedCount > 0 ? 'MODIFIED' : 'UNCHANGED',
      newCount,
      modifiedCount,
      processedCases
    };
  }
}
