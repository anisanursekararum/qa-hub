import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TestcaseService } from './testcase.service';
import { CreateTestcaseDto } from './dto/create-testcase.dto';
import { UpdateTestcaseDto } from './dto/update-testcase.dto';

@Controller('testcase')
export class TestcaseController {
  constructor(private readonly testcaseService: TestcaseService) {}

  @Post()
  create(@Body() createTestcaseDto: CreateTestcaseDto) {
    return this.testcaseService.create(createTestcaseDto);
  }

  @Get()
  findAll() {
    return this.testcaseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testcaseService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestcaseDto: UpdateTestcaseDto) {
    return this.testcaseService.update(+id, updateTestcaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testcaseService.remove(+id);
  }
}
