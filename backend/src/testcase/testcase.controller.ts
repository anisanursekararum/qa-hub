import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TestcaseService } from './testcase.service';
import { CreateTestCaseDto, UpdateTestCaseDto } from './dto/testcase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('testcase')
@UseGuards(JwtAuthGuard)
export class TestcaseController {
  constructor(private readonly testcaseService: TestcaseService) {}

  @Post()
  create(@Request() req: any, @Query('projectId') projectId: string, @Body() dto: CreateTestCaseDto) {
    return this.testcaseService.create(projectId, req.user.userId, dto);
  }

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.testcaseService.findAll(projectId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestCaseDto) {
    return this.testcaseService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testcaseService.remove(id);
  }
}
