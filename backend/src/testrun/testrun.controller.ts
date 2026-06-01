import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { TestrunService } from './testrun.service';
import { CreateTestRunDto, DuplicateTestRunDto, AddTestCasesDto, RemoveTestCasesDto, UpdateTestRunItemDto } from './dto/testrun.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('testrun')
@UseGuards(JwtAuthGuard)
export class TestrunController {
  constructor(private readonly testrunService: TestrunService) {}

  @Post()
  create(@Query('projectId') projectId: string, @Body() dto: CreateTestRunDto, @Req() req: any) {
    return this.testrunService.create(projectId, dto, req.user.userId);
  }

  @Post('duplicate')
  duplicate(@Query('projectId') projectId: string, @Body() dto: DuplicateTestRunDto, @Req() req: any) {
    return this.testrunService.duplicate(projectId, dto, req.user.userId);
  }

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.testrunService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testrunService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: 'DRAFT' | 'IN_PROGRESS' | 'AUTOMATION_RUNNING' | 'DONE') {
    return this.testrunService.updateStatus(id, status);
  }

  @Post(':id/items')
  addItems(@Param('id') id: string, @Body() dto: AddTestCasesDto) {
    return this.testrunService.addItems(id, dto);
  }

  @Delete(':id/items')
  removeItems(@Param('id') id: string, @Body() dto: RemoveTestCasesDto) {
    return this.testrunService.removeItems(id, dto);
  }

  @Patch(':id/items/:testCaseId')
  updateItemStatus(
    @Param('id') id: string,
    @Param('testCaseId') testCaseId: string,
    @Body() dto: UpdateTestRunItemDto
  ) {
    return this.testrunService.updateItemStatus(id, testCaseId, dto);
  }

  @Post(':id/trigger')
  triggerAutomation(@Param('id') id: string) {
    return this.testrunService.triggerAutomation(id);
  }
}
