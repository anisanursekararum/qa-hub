import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { TestcaseService } from './testcase.service';
import { AiGeneratorService } from './ai-generator.service';
import { CreateTestCaseDto, UpdateTestCaseDto, BulkImportTestCaseDto } from './dto/testcase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfParserService } from './pdf-parser.service';
import { AiTestGeneratorService } from './ai-test-generator.service';
import { TestRunGateway } from '../testrun/testrun/testrun.gateway';

@Controller('testcase')
@UseGuards(JwtAuthGuard)
export class TestcaseController {
  constructor(
    private readonly testcaseService: TestcaseService,
    private readonly aiGeneratorService: AiGeneratorService,
    private readonly pdfParserService: PdfParserService,
    private readonly aiTestGeneratorService: AiTestGeneratorService,
    private readonly testRunGateway: TestRunGateway,
  ) {}

  @Get('bulk/history')
  getImportHistory(
    @Query('projectId') projectId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5'
  ) {
    return this.testcaseService.getImportHistory(projectId, parseInt(page, 10), parseInt(limit, 10));
  }

  @Get('prd/history')
  getPrdImportHistory(
    @Query('projectId') projectId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5'
  ) {
    return this.testcaseService.getPrdImportHistory(projectId, parseInt(page, 10), parseInt(limit, 10));
  }

  @Post('generate')
  @UseInterceptors(FileInterceptor('file'))
  generate(
    @Request() req: any,
    @Query('projectId') projectId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }
    return this.aiGeneratorService.generateTestCasesFromPdf(projectId, req.user.userId, file.buffer, file.originalname);
  }

  @Post('sync-prd')
  @UseInterceptors(FileInterceptor('file'))
  async syncPrd(
    @Request() req: any,
    @Query('projectId') projectId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    let status = 'SUCCESS';
    let rowCount = 0;
    let newCount = 0;
    let modifiedCount = 0;
    const results = [];

    try {
      // Emit progress event: parsing
      this.testRunGateway.broadcastAiProgress('parsing', 'Sedang membaca dokumen PDF...');

      const text = await this.pdfParserService.extractText(file.buffer);
      const chunks = this.pdfParserService.chunkText(text);

      // Emit progress event: matching
      this.testRunGateway.broadcastAiProgress('matching', 'Membandingkan dengan test case yang ada di database...');

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Emit progress event: generating for each chunk
        this.testRunGateway.broadcastAiProgress(
          'generating',
          `Memproses bagian ${i + 1} dari ${chunks.length}: mendeteksi perubahan dan memperbarui test case...`
        );

        const result = await this.aiTestGeneratorService.processPrdChunk(projectId, req.user.userId, chunk);

        newCount += result.newCount || 0;
        modifiedCount += result.modifiedCount || 0;

        results.push({ chunk: chunk.substring(0, 100) + '...', ...result });
      }

      rowCount = newCount + modifiedCount;

      // Emit progress event: done
      this.testRunGateway.broadcastAiProgress(
        'done',
        `Selesai! ${newCount} test case baru dibuat, ${modifiedCount} diperbarui.`
      );

      return results;
    } catch (error: any) {
      status = 'FAILED';
      this.testRunGateway.broadcastAiProgress(
        'done',
        `Gagal memproses PRD: ${error.message || error}`
      );
      throw error;
    } finally {
      await this.testcaseService.createPrdImportHistory(
        projectId,
        req.user.userId,
        file.originalname,
        rowCount,
        status
      );
    }
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
