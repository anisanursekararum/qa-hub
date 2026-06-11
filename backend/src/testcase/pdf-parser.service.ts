import { Injectable, BadRequestException } from '@nestjs/common';
import pdf = require('pdf-parse');

@Injectable()
export class PdfParserService {
  /**
   * Extracts plain text from a PDF buffer.
   */
  async extractText(pdfBuffer: Buffer): Promise<string> {
    try {
      const parsedPdf = await pdf(pdfBuffer);
      return parsedPdf.text || '';
    } catch (error: any) {
      throw new BadRequestException(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Chunks text based on Markdown headers or chapter/feature markers.
   * Ensures text is split by functional sections (features/user stories/chapters).
   */
  chunkText(text: string): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const lines = text.split(/\r?\n/);
    const chunks: string[] = [];
    let currentChunkLines: string[] = [];

    // Regular expressions to detect headers/markers:
    // 1. Markdown headers: # Header, ## Subheader, etc.
    // 2. Section/Feature/User Story markers: e.g., "Feature: ...", "User Story: ...", "Scenario: ...", "Bab [0-9]: ...", "Chapter [0-9]: ...", "Module: ..."
    const markdownHeaderRegex = /^#{1,6}\s+(.+)$/;
    const keywordHeaderRegex = /^(Feature|User\s+Story|Scenario|Bab|Chapter|Module)\s*(\d*)\s*:\s*(.+)$/i;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if the line is a header
      const isMarkdownHeader = markdownHeaderRegex.test(trimmedLine);
      const isKeywordHeader = keywordHeaderRegex.test(trimmedLine);

      if (isMarkdownHeader || isKeywordHeader) {
        // If we have accumulated lines in the current chunk, save it
        if (currentChunkLines.length > 0) {
          const chunkText = currentChunkLines.join('\n').trim();
          if (chunkText) {
            chunks.push(chunkText);
          }
          currentChunkLines = [];
        }
      }

      currentChunkLines.push(line);
    }

    // Push the last remaining chunk
    if (currentChunkLines.length > 0) {
      const chunkText = currentChunkLines.join('\n').trim();
      if (chunkText) {
        chunks.push(chunkText);
      }
    }

    return chunks;
  }
}
