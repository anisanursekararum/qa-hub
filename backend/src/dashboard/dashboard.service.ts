import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionStatus, RunStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    // 1. Get user's projects
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map(m => m.projectId);

    if (projectIds.length === 0) {
      return this.emptySummary();
    }

    // 2. Active Runs Count
    const activeRunsCount = await this.prisma.testRun.count({
      where: {
        projectId: { in: projectIds },
        status: { in: [RunStatus.IN_PROGRESS, RunStatus.AUTOMATION_RUNNING] },
      },
    });

    // 3. Failed Tests Count (Open Defects proxy)
    const failedTestsCount = await this.prisma.testRunItem.count({
      where: {
        testRun: {
          projectId: { in: projectIds },
          status: { in: [RunStatus.IN_PROGRESS, RunStatus.AUTOMATION_RUNNING] }
        },
        executionStatus: ExecutionStatus.FAILED,
      },
    });

    // 4. Test Coverage
    const totalCases = await this.prisma.testCase.count({
      where: { projectId: { in: projectIds } },
    });
    const automatedCases = await this.prisma.testCase.count({
      where: { projectId: { in: projectIds }, hasAutomation: true },
    });
    
    const testCoverage = totalCases > 0 ? Math.round((automatedCases / totalCases) * 100) : 0;

    // 5. Projects with member count
    const projectsData = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        _count: {
          select: { members: true, testRuns: true }
        }
      },
      take: 4,
      orderBy: { createdAt: 'desc' }
    });

    const projects = projectsData.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      membersCount: p._count.members,
      runsCount: p._count.testRuns,
    }));

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 6. Activity Feed (latest updated TestRuns and TestCases)
    const recentActivityRuns = await this.prisma.testRun.findMany({
      where: { 
        projectId: { in: projectIds },
        updatedAt: { gte: oneDayAgo }
      },
      take: 200,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        project: { select: { name: true } },
        initiatedBy: { select: { name: true } }
      }
    });

    const recentActivityCases = await this.prisma.testCase.findMany({
      where: { 
        projectId: { in: projectIds },
        updatedAt: { gte: oneDayAgo }
      },
      take: 200,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        publicId: true,
        title: true,
        status: true,
        updatedAt: true,
        project: { select: { name: true } },
        updatedBy: { select: { name: true } }
      }
    });

    let activities: any[] = [];
    
    recentActivityRuns.forEach(run => {
      activities.push({
        id: `run-${run.id}`,
        linkId: run.id,
        type: 'TEST_RUN',
        title: `Test Run: ${run.name}`,
        description: `Status updated to ${run.status} in ${run.project.name}`,
        time: run.updatedAt.toISOString(),
        user: run.initiatedBy?.name || 'System'
      });
    });

    recentActivityCases.forEach(tc => {
      activities.push({
        id: `case-${tc.id}`,
        linkId: tc.publicId || tc.id,
        type: 'TEST_CASE',
        title: `Test Case: ${tc.title}`,
        description: `Status updated to ${tc.status} in ${tc.project.name}`,
        time: tc.updatedAt.toISOString(),
        user: tc.updatedBy?.name || 'System'
      });
    });

    // Sort descending by time
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // 7. Performance Table Data (latest TestRuns with item counts)
    const recentRuns = await this.prisma.testRun.findMany({
      where: { projectId: { in: projectIds } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        project: { select: { name: true } },
        items: { select: { executionStatus: true } }
      }
    });

    const performance = recentRuns.map(run => {
      let passed = 0, failed = 0, todo = 0;
      run.items.forEach(item => {
        if (item.executionStatus === ExecutionStatus.PASSED) passed++;
        else if (item.executionStatus === ExecutionStatus.FAILED) failed++;
        else todo++;
      });
      return {
        id: run.id,
        runName: run.name,
        projectName: run.project.name,
        status: run.status,
        passed,
        failed,
        todo
      };
    });

    return {
      stats: {
        activeRuns: activeRunsCount,
        openDefects: failedTestsCount,
        testCoverage: testCoverage
      },
      projects,
      activities,
      performance
    };
  }

  private emptySummary() {
    return {
      stats: { activeRuns: 0, openDefects: 0, testCoverage: 0 },
      projects: [],
      activities: [],
      performance: []
    };
  }
}
