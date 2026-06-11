import { Module } from '@nestjs/common';
import { TestcaseService } from './testcase.service';
import { TestcaseController } from './testcase.controller';
import { AiGeneratorService } from './ai-generator.service';
import { PdfParserService } from './pdf-parser.service';
import { AiTestGeneratorService } from './ai-test-generator.service';
import { TestrunModule } from '../testrun/testrun.module';

@Module({
  imports: [TestrunModule],
  controllers: [TestcaseController],
  providers: [TestcaseService, AiGeneratorService, PdfParserService, AiTestGeneratorService],
  exports: [PdfParserService, AiTestGeneratorService],
})
export class TestcaseModule {}
