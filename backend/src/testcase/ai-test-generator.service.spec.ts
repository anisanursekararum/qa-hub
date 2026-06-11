import { Test, TestingModule } from '@nestjs/testing';
import { AiTestGeneratorService } from './ai-test-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Google Generative AI
const mockEmbedContent = jest.fn().mockResolvedValue({
  embedding: { values: new Array(768).fill(0.1) }
});
const mockGenerateContent = jest.fn().mockResolvedValue({
  response: {
    text: () => JSON.stringify({
      actions: [
        {
          status: 'NEW',
          reason: 'New feature not covered by existing test cases.',
          testCase: {
            title: 'Verify new feature',
            moduleName: 'User Management',
            moduleCode: 'USER',
            steps: '1. Click login',
            expectedResult: 'Should login',
            priority: 'HIGH'
          }
        }
      ]
    })
  }
});
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  embedContent: mockEmbedContent,
  generateContent: mockGenerateContent
});

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: mockGetGenerativeModel
      };
    }),
    SchemaType: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY'
    }
  };
});

describe('AiTestGeneratorService', () => {
  let service: AiTestGeneratorService;
  let prisma: PrismaService;

  const mockPrisma = {
    $queryRawUnsafe: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    projectModule: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    testCase: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiTestGeneratorService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile();

    service = module.get<AiTestGeneratorService>(AiTestGeneratorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEmbedding', () => {
    it('should generate and pad embedding to 1536 dimensions', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      const embedding = await service.getEmbedding('test text');
      expect(embedding).toHaveLength(1536);
      expect(embedding[0]).toBe(0.1);
      expect(embedding[768]).toBe(0); // padded
    });
  });

  describe('processPrdChunk', () => {
    it('should handle status NEW correctly', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]); // no closest testcase
      mockPrisma.projectModule.findFirst.mockResolvedValue(null);
      mockPrisma.projectModule.create.mockResolvedValue({ id: 'mod-1', code: 'USER' });
      mockPrisma.projectModule.update.mockResolvedValue({ id: 'mod-1', code: 'USER', currentSequence: 5 });
      mockPrisma.testCase.create.mockResolvedValue({ id: 'tc-123', title: 'Verify new feature' });

      const result = await service.processPrdChunk('project-1', 'user-1', 'As a user I want to edit my profile');

      expect(result.action).toBe('NEW');
      expect(result.processedCases[0].testCase?.title).toBe('Verify new feature');
      expect(mockPrisma.testCase.create).toHaveBeenCalled();
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled(); // to update embedding
    });

    it('should handle status MODIFIED correctly', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      
      // Mock closest testcase found
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 'tc-old', title: 'Old testcase' }]);
      mockPrisma.testCase.findUnique.mockResolvedValue({ id: 'tc-old', title: 'Old testcase' });
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({
            actions: [
              {
                status: 'MODIFIED',
                closestTestCaseId: 'tc-old',
                reason: 'Modified existing feature description.',
                testCase: {
                  title: 'Updated title',
                  moduleName: 'User Management',
                  moduleCode: 'USER',
                  steps: 'Updated steps',
                  expectedResult: 'Updated expected',
                  priority: 'MEDIUM'
                }
              }
            ]
          })
        }
      });
      mockPrisma.testCase.update.mockResolvedValue({ id: 'tc-old', title: 'Updated title' });

      const result = await service.processPrdChunk('project-1', 'user-1', 'Updated requirement');

      expect(result.action).toBe('MODIFIED');
      expect(result.processedCases[0].testCase?.title).toBe('Updated title');
      expect(mockPrisma.testCase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tc-old' }
        })
      );
    });

    it('should handle status UNCHANGED correctly', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 'tc-old', title: 'Old testcase' }]);
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({
            actions: [
              {
                status: 'UNCHANGED',
                reason: 'Already fully covered.'
              }
            ]
          })
        }
      });

      const result = await service.processPrdChunk('project-1', 'user-1', 'Existing requirement');

      expect(result.action).toBe('UNCHANGED');
      expect(mockPrisma.testCase.create).not.toHaveBeenCalled();
      expect(mockPrisma.testCase.update).not.toHaveBeenCalled();
    });
  });
});
