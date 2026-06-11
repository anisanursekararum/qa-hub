import { Test, TestingModule } from '@nestjs/testing';
import { PdfParserService } from './pdf-parser.service';
import * as pdf from 'pdf-parse';

jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation((buffer) => {
    if (buffer.toString() === 'invalid') {
      throw new Error('Invalid PDF');
    }
    return Promise.resolve({ text: 'Extracted PDF text content' });
  });
});

describe('PdfParserService', () => {
  let service: PdfParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfParserService],
    }).compile();

    service = module.get<PdfParserService>(PdfParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractText', () => {
    it('should successfully extract text from PDF buffer', async () => {
      const result = await service.extractText(Buffer.from('valid pdf content'));
      expect(result).toBe('Extracted PDF text content');
    });

    it('should throw BadRequestException if extraction fails', async () => {
      await expect(service.extractText(Buffer.from('invalid'))).rejects.toThrow(
        'Failed to extract text from PDF: Invalid PDF',
      );
    });
  });

  describe('chunkText', () => {
    it('should return an empty array if text is empty', () => {
      expect(service.chunkText('')).toEqual([]);
      expect(service.chunkText('   ')).toEqual([]);
    });

    it('should chunk text based on Markdown headers', () => {
      const mockPrd = [
        '# Introduction',
        'This is the intro section.',
        '## User Authentication',
        'User authentication details go here.',
        '### Login Flow',
        'Steps to login.',
      ].join('\n');

      const chunks = service.chunkText(mockPrd);

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toBe('# Introduction\nThis is the intro section.');
      expect(chunks[1]).toBe('## User Authentication\nUser authentication details go here.');
      expect(chunks[2]).toBe('### Login Flow\nSteps to login.');
    });

    it('should chunk text based on Keyword headers', () => {
      const mockPrd = [
        'Feature: User Management',
        'As an admin, I want to manage users.',
        'User Story 1: Create User',
        'Steps for creating user.',
        'Scenario: Password validation',
        'Verify password rules.',
        'Bab 1: System requirements',
        'Overview.',
      ].join('\n');

      const chunks = service.chunkText(mockPrd);

      expect(chunks).toHaveLength(4);
      expect(chunks[0]).toBe('Feature: User Management\nAs an admin, I want to manage users.');
      expect(chunks[1]).toBe('User Story 1: Create User\nSteps for creating user.');
      expect(chunks[2]).toBe('Scenario: Password validation\nVerify password rules.');
      expect(chunks[3]).toBe('Bab 1: System requirements\nOverview.');
    });
  });
});
