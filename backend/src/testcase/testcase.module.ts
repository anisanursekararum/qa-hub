import { Module } from '@nestjs/common';
import { TestcaseService } from './testcase.service';
import { TestcaseController } from './testcase.controller';

@Module({
  controllers: [TestcaseController],
  providers: [TestcaseService],
})
export class TestcaseModule {}
