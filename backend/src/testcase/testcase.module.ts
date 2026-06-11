import { Module } from '@nestjs/common';
import { TestcaseService } from './testcase.service';
import { TestcaseController } from './testcase.controller';
import { AiGeneratorService } from './ai-generator.service';

@Module({
  controllers: [TestcaseController],
  providers: [TestcaseService, AiGeneratorService],
})
export class TestcaseModule {}
