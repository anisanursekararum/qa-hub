import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestRunDto, DuplicateTestRunDto, AddTestCasesDto, RemoveTestCasesDto, UpdateTestRunItemDto } from './dto/testrun.dto';
import { TestRunGateway } from './testrun/testrun.gateway';
import { Prisma } from '@prisma/client';

@Injectable()
export class TestrunService {
  private readonly logger = new Logger(TestrunService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: TestRunGateway,
  ) {}

  private async generateNextRunId(projectId: string): Promise<string> {
    const today = new Date();
    const prefix = `TR-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-`;
    
    // Count existing runs for this project created today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await this.prisma.testRun.count({
      where: {
        projectId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });

    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  async create(projectId: string, dto: CreateTestRunDto, userId: string) {
    const runIdName = await this.generateNextRunId(projectId);
    
    return this.prisma.testRun.create({
      data: {
        projectId,
        name: `${runIdName} - ${dto.name}`,
        status: 'DRAFT',
        initiatedById: userId,
        environment: dto.environment || null,
      },
      include: {
        items: true,
      }
    });
  }

  async findAll(projectId: string) {
    return this.prisma.testRun.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { items: true }
        },
        items: {
          select: { executionStatus: true }
        },
        initiatedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const run = await this.prisma.testRun.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            testCase: true,
          }
        },
        initiatedBy: {
          select: { name: true, email: true }
        }
      }
    });
    if (!run) throw new NotFoundException('Test run not found');
    return run;
  }

  async updateName(id: string, name: string) {
    return this.prisma.testRun.update({
      where: { id },
      data: { name }
    });
  }

  async updateEnvironment(id: string, environment: string) {
    return this.prisma.testRun.update({
      where: { id },
      data: { environment }
    });
  }

  async deleteRun(id: string) {
    return this.prisma.testRun.delete({
      where: { id }
    });
  }

  async duplicate(projectId: string, dto: DuplicateTestRunDto, userId: string) {
    const sourceRun = await this.prisma.testRun.findUnique({
      where: { id: dto.sourceRunId },
      include: { items: true }
    });

    if (!sourceRun || sourceRun.projectId !== projectId) {
      throw new NotFoundException('Source test run not found');
    }

    const runIdName = await this.generateNextRunId(projectId);
    const newName = `${runIdName} - Copy of ${sourceRun.name.split(' - ')[1] || sourceRun.name}`;

    return this.prisma.testRun.create({
      data: {
        projectId,
        name: newName,
        status: 'DRAFT',
        initiatedById: userId,
        environment: sourceRun.environment,
        items: {
          create: sourceRun.items.map(item => ({
            testCaseId: item.testCaseId,
            executionStatus: 'TO_DO',
          }))
        }
      },
      include: { items: true }
    });
  }

  async addItems(id: string, dto: AddTestCasesDto) {
    const run = await this.prisma.testRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException('Test run not found');
    if (run.status !== 'DRAFT') throw new BadRequestException('Can only add items in DRAFT state');

    // Validate that none of the target test cases are in DRAFT status
    const draftCases = await this.prisma.testCase.findMany({
      where: {
        id: { in: dto.testCaseIds },
        status: 'DRAFT',
      },
      select: { publicId: true, title: true },
    });

    if (draftCases.length > 0) {
      const draftList = draftCases.map(c => c.publicId || c.title).join(', ');
      throw new BadRequestException(`Cannot add test cases in DRAFT status to a Test Run: ${draftList}`);
    }

    // Create many without duplicates (use createMany and skipDuplicates)
    await this.prisma.testRunItem.createMany({
      data: dto.testCaseIds.map(tcId => ({
        testRunId: id,
        testCaseId: tcId,
      })),
      skipDuplicates: true,
    });

    return this.findOne(id);
  }

  async removeItems(id: string, dto: RemoveTestCasesDto) {
    const run = await this.prisma.testRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException('Test run not found');
    if (run.status !== 'DRAFT') throw new BadRequestException('Can only remove items in DRAFT state');

    await this.prisma.testRunItem.deleteMany({
      where: {
        testRunId: id,
        testCaseId: { in: dto.testCaseIds }
      }
    });

    return this.findOne(id);
  }

  async updateStatus(id: string, status: 'DRAFT' | 'IN_PROGRESS' | 'AUTOMATION_RUNNING' | 'DONE' | 'ARCHIVED') {
    const existing = await this.prisma.testRun.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Test run not found');

    const updateData: any = { status };
    
    // Auto set startedAt
    if ((status === 'IN_PROGRESS' || status === 'AUTOMATION_RUNNING') && !existing.startedAt) {
      updateData.startedAt = new Date();
    }
    
    // Auto set endedAt
    if (status === 'DONE' && !existing.endedAt) {
      updateData.endedAt = new Date();
    }

    const run = await this.prisma.testRun.update({
      where: { id },
      data: updateData
    });
    this.gateway.broadcastRunStatus(id, status);
    return run;
  }

  async updateItemStatus(runId: string, testCaseId: string, dto: UpdateTestRunItemDto) {
    const run = await this.prisma.testRun.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Test run not found');
    if (run.status === 'AUTOMATION_RUNNING') throw new BadRequestException('Automation is running. Manual updates are locked.');

    const item = await this.prisma.testRunItem.update({
      where: {
        testRunId_testCaseId: {
          testRunId: runId,
          testCaseId: testCaseId,
        }
      },
      data: {
        executionStatus: dto.executionStatus,
        notes: dto.notes,
      }
    });

    this.gateway.broadcastItemStatus(runId, testCaseId, item.executionStatus, item.notes || undefined);
    return item;
  }

  async triggerAutomation(id: string) {
    const run = await this.prisma.testRun.findUnique({
      where: { id },
      include: {
        items: {
          include: { testCase: true }
        }
      }
    });

    if (!run) throw new NotFoundException('Test run not found');
    if (run.status !== 'IN_PROGRESS') throw new BadRequestException('Run must be IN_PROGRESS to trigger automation');

    await this.updateStatus(id, 'AUTOMATION_RUNNING');

    // Filter items that have automation and are TO_DO or FAILED
    const itemsToRun = run.items.filter(i => i.testCase.hasAutomation && (i.executionStatus === 'TO_DO' || i.executionStatus === 'FAILED'));

    this.logger.log(`Starting automation for run ${id}, ${itemsToRun.length} items`);
    this.gateway.broadcastLog(id, `[SYSTEM] Automation Engine Initialized. Target: ${itemsToRun.length} automated cases.`);

    // Run simulator asynchronously without blocking the HTTP response
    this.simulateAutomation(id, itemsToRun).catch(err => {
      this.logger.error(`Error in automation simulator for run ${id}:`, err);
    });

    return { message: 'Automation triggered successfully', count: itemsToRun.length };
  }

  private async simulateAutomation(runId: string, items: any[]) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const testCaseId = item.testCase.publicId || item.testCaseId;
      
      this.gateway.broadcastLog(runId, `[EXEC] Starting execution for ${testCaseId} - ${item.testCase.title}...`);
      
      // Simulate execution time (1-3 seconds)
      const delay = Math.floor(Math.random() * 2000) + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate result (80% pass rate)
      const passed = Math.random() < 0.8;
      const status = passed ? 'PASSED' : 'FAILED';
      const notes = passed ? 'Automation script executed successfully.' : 'Assertion error on element #submit-btn';

      // Update in DB
      await this.prisma.testRunItem.update({
        where: { id: item.id },
        data: {
          executionStatus: status,
          notes: notes,
          retryCount: passed ? item.retryCount : item.retryCount + 1,
        }
      });

      this.gateway.broadcastLog(runId, `[RES] ${testCaseId} finished with status: ${status}. Duration: ${delay}ms`);
      this.gateway.broadcastItemStatus(runId, item.testCaseId, status, notes);
    }

    this.gateway.broadcastLog(runId, `[SYSTEM] Automation execution completed.`);
    await this.updateStatus(runId, 'IN_PROGRESS'); // return to IN_PROGRESS so user can review or close
  }
}
