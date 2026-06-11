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
      const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
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
   * Processes a single PRD text chunk to either create, modify, or keep test cases.
   */
  async processPrdChunk(projectId: string, userId: string, prdChunk: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new BadRequestException('GEMINI_API_KEY is not configured.');
    }

    // 1. Generate embedding for the PRD chunk
    const prdEmbedding = await this.getEmbedding(prdChunk);
    const prdEmbeddingStr = `[${prdEmbedding.join(',')}]`;

    // 2. Find the closest test case using cosine distance similarity
    const closestCases: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id, title, "projectId", "publicId", "moduleId", prerequisite, steps, "expectedResult", priority, notes
      FROM "TestCase"
      WHERE "projectId" = $1 AND embedding IS NOT NULL
      ORDER BY embedding <=> $2::vector
      LIMIT 1
    `, projectId, prdEmbeddingStr);

    const oldTestCase = closestCases && closestCases.length > 0 ? closestCases[0] : null;

    // 3. Send chunk + closest case to Gemini
    const schema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          enum: ['NEW', 'MODIFIED', 'UNCHANGED'],
          format: 'enum',
          description: 'Action to take. NEW if the PRD chunk describes a completely new feature/story that has no matching test case. MODIFIED if the closest test case matches but needs updates to cover the changes in the PRD chunk. UNCHANGED if the closest test case already fully and accurately covers the PRD chunk.',
        },
        reason: {
          type: SchemaType.STRING,
          description: 'Explanation for why this status was chosen.',
        },
        testCase: {
          type: SchemaType.OBJECT,
          description: 'The test case details. Required if status is NEW or MODIFIED.',
          properties: {
            title: {
              type: SchemaType.STRING,
              description: 'Descriptive test case title representing the scenario.',
            },
            moduleName: {
              type: SchemaType.STRING,
              description: 'The user-friendly name of the functional module.',
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
              description: 'Sequential, clear test steps (e.g. "1. Step one\\n2. Step two").',
            },
            expectedResult: {
              type: SchemaType.STRING,
              description: 'Expected result after executing all steps.',
            },
            priority: {
              type: SchemaType.STRING,
              enum: ['HIGH', 'MEDIUM', 'LOW'],
              format: 'enum',
              description: 'Risk-based priority level.',
            },
            notes: {
              type: SchemaType.STRING,
              description: 'Additional notes or comments.',
            },
          },
          required: ['title', 'moduleName', 'moduleCode', 'steps', 'expectedResult', 'priority'],
        },
      },
      required: ['status', 'reason'],
    };

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    let oldTestCaseContext = 'None found.';
    if (oldTestCase) {
      oldTestCaseContext = JSON.stringify({
        id: oldTestCase.id,
        title: oldTestCase.title,
        prerequisite: oldTestCase.prerequisite,
        steps: oldTestCase.steps,
        expectedResult: oldTestCase.expectedResult,
        priority: oldTestCase.priority,
        notes: oldTestCase.notes,
      }, null, 2);
    }

    const prompt = `
      You are a Senior Quality Engineering Manager.
      
      Compare the following PRD Text Chunk with the Closest Existing Test Case in our database.
      
      --- PRD TEXT CHUNK ---
      ${prdChunk}
      
      --- CLOSEST EXISTING TEST CASE ---
      ${oldTestCaseContext}
      
      Evaluate:
      1. If the PRD chunk specifies new features or scenarios that do NOT exist in the closest test case, set status to "NEW" and generate a brand new test case in the JSON response.
      2. If the closest test case matches the feature in the PRD chunk, but some requirements, steps, or details are modified or updated in the PRD chunk, set status to "MODIFIED" and provide the updated test case fields in the JSON response.
      3. If the closest test case already fully and accurately covers all instructions in the PRD chunk, set status to "UNCHANGED".
      
      Provide the output strictly in the requested JSON schema.
    `;

    let generatedJson: any;
    try {
      const result = await model.generateContent(prompt);
      generatedJson = JSON.parse(result.response.text());
    } catch (error: any) {
      throw new InternalServerErrorException(`Gemini generation or JSON parse failed: ${error.message}`);
    }

    const status = generatedJson.status;
    const item = generatedJson.testCase;

    if (status === 'NEW' && item) {
      // Create new module if not exists
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

      return { action: 'NEW', testCase: createdCase, reason: generatedJson.reason };
    } 
    
    if (status === 'MODIFIED' && item && oldTestCase) {
      // Patch existing testcase
      let dbPriority: CasePriority = CasePriority.MEDIUM;
      if (item.priority === 'HIGH') dbPriority = CasePriority.HIGH;
      if (item.priority === 'LOW') dbPriority = CasePriority.LOW;

      // Update basic fields
      const updatedCase = await this.prisma.testCase.update({
        where: { id: oldTestCase.id },
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

      return { action: 'MODIFIED', testCase: updatedCase, reason: generatedJson.reason };
    }

    return { action: 'UNCHANGED', reason: generatedJson.reason };
  }
}
