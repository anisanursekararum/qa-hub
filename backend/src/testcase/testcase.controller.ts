import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TestcaseService } from './testcase.service';
import { CreateTestCaseDto, UpdateTestCaseDto, BulkImportTestCaseDto } from './dto/testcase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('testcase')
@UseGuards(JwtAuthGuard)
export class TestcaseController {
  constructor(private readonly testcaseService: TestcaseService) {}

  @Get('bulk/history')
  getImportHistory(
    @Query('projectId') projectId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5'
  ) {
    return this.testcaseService.getImportHistory(projectId, parseInt(page, 10), parseInt(limit, 10));
  }

  @Post('bulk')
  importBulk(@Request() req: any, @Query('projectId') projectId: string, @Body() dto: BulkImportTestCaseDto) {
    return this.testcaseService.importBulk(projectId, req.user.userId, dto);
  }

  @Post()
  create(@Request() req: any, @Query('projectId') projectId: string, @Body() dto: CreateTestCaseDto) {
    return this.testcaseService.create(projectId, req.user.userId, dto);
  }

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.testcaseService.findAll(projectId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTestCaseDto) {
    return this.testcaseService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testcaseService.remove(id);
  }
}
