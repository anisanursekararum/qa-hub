import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestCaseDto, UpdateTestCaseDto, BulkImportTestCaseDto } from './dto/testcase.dto';

@Injectable()
export class TestcaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, userId: string, dto: CreateTestCaseDto) {
    // 1. Fetch the module to get its code and current sequence
    const module = await this.prisma.projectModule.findUnique({
      where: { id: dto.moduleId },
    });

    if (!module || module.projectId !== projectId) {
      throw new NotFoundException('Module not found or does not belong to this project');
    }

    // 2. Increment sequence atomically and generate public ID
    const updatedModule = await this.prisma.projectModule.update({
      where: { id: module.id },
      data: { currentSequence: { increment: 1 } },
    });

    // Example: TC-AUTH-001
    const publicId = `TC-${updatedModule.code}-${String(updatedModule.currentSequence).padStart(3, '0')}`;

    // 3. Create the testcase
    return this.prisma.testCase.create({
      data: {
        projectId,
        publicId,
        title: dto.title,
        moduleId: dto.moduleId,
        prerequisite: dto.prerequisite || null,
        steps: JSON.stringify([{ step: dto.steps }]), // Simple JSON for now based on user mock
        expectedResult: dto.expectedResult || null,
        hasAutomation: dto.hasAutomation,
        priority: dto.priority || 'MEDIUM',
        notes: dto.notes || null,
        createdById: userId,
        updatedById: userId,
        createdVia: 'FORM',
      },
      include: {
        module: true,
        createdBy: {
          select: { name: true, email: true }
        },
        updatedBy: {
          select: { name: true, email: true }
        }
      }
    });
  }

  async findAll(projectId: string) {
    return this.prisma.testCase.findMany({
      where: { projectId },
      include: {
        module: true,
        createdBy: {
          select: { name: true, email: true }
        },
        updatedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, dto: UpdateTestCaseDto) {
    return this.prisma.testCase.update({
      where: { id },
      data: {
        title: dto.title,
        moduleId: dto.moduleId,
        prerequisite: dto.prerequisite,
        steps: JSON.stringify([{ step: dto.steps }]),
        expectedResult: dto.expectedResult,
        hasAutomation: dto.hasAutomation,
        status: dto.status,
        priority: dto.priority,
        notes: dto.notes,
        updatedById: userId,
      },
      include: {
        module: true,
        createdBy: {
          select: { name: true, email: true }
        },
        updatedBy: {
          select: { name: true, email: true }
        }
      }
    });
  }

  async remove(id: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
      include: { testRunItems: true }
    });

    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    if (testCase.testRunItems && testCase.testRunItems.length > 0) {
      throw new BadRequestException('Cannot delete test case: It is already part of one or more Test Runs.');
    }

    return this.prisma.testCase.delete({
      where: { id },
    });
  }

  async importBulk(projectId: string, userId: string, dto: BulkImportTestCaseDto) {
    const results = [];
    let status = 'SUCCESS';

    try {
      // Process sequentially to safely update module sequences and generate publicIds
      for (const item of dto.items) {
        // 1. Find or create module
        const moduleCode = item.moduleCode.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
        
        let module = await this.prisma.projectModule.findFirst({
          where: { projectId, code: moduleCode }
        });

        if (!module) {
          module = await this.prisma.projectModule.create({
            data: {
              projectId,
              name: item.moduleName,
              code: moduleCode,
            }
          });
        }

        // 2. Increment sequence atomically
        const updatedModule = await this.prisma.projectModule.update({
          where: { id: module.id },
          data: { currentSequence: { increment: 1 } },
        });

        // 3. Generate public ID
        const publicId = `TC-${updatedModule.code}-${String(updatedModule.currentSequence).padStart(3, '0')}`;

        // 4. Create the test case
        const createdCase = await this.prisma.testCase.create({
          data: {
            projectId,
            publicId,
            title: item.title,
            moduleId: updatedModule.id,
            prerequisite: item.prerequisite || null,
            steps: JSON.stringify([{ step: item.steps }]),
            expectedResult: item.expectedResult || null,
            hasAutomation: item.hasAutomation,
            status: 'DRAFT',
            priority: item.priority || 'MEDIUM',
            notes: item.notes || null,
            createdById: userId,
            updatedById: userId,
            createdVia: 'BULK_UPLOAD',
          }
        });

        results.push(createdCase);
      }
    } catch (error) {
      status = 'FAILED';
      throw error;
    } finally {
      // Record history
      await this.prisma.csvImportHistory.create({
        data: {
          projectId,
          fileName: dto.fileName,
          rowCount: dto.items.length,
          uploadedById: userId,
          status,
        }
      });
    }

    return { importedCount: results.length };
  }

  async getImportHistory(projectId: string, page: number = 1, limit: number = 5) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.csvImportHistory.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: { name: true, email: true }
          }
        }
      }),
      this.prisma.csvImportHistory.count({ where: { projectId } })
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPrdImportHistory(projectId: string, page: number = 1, limit: number = 5) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.prdImportHistory.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: { name: true, email: true }
          }
        }
      }),
      this.prisma.prdImportHistory.count({ where: { projectId } })
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async createPrdImportHistory(projectId: string, userId: string, fileName: string, rowCount: number, status: string) {
    return this.prisma.prdImportHistory.create({
      data: {
        projectId,
        fileName,
        rowCount,
        uploadedById: userId,
        status,
      },
    });
  }
}

