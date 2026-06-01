import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestCaseDto, UpdateTestCaseDto } from './dto/testcase.dto';

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
        createdById: userId,
      },
      include: {
        module: true,
        createdBy: {
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
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateTestCaseDto) {
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
      },
      include: {
        module: true,
        createdBy: {
          select: { name: true, email: true }
        }
      }
    });
  }

  async remove(id: string) {
    return this.prisma.testCase.delete({
      where: { id },
    });
  }
}
