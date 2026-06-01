import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { TestcaseModule } from './testcase/testcase.module';
import { TestrunModule } from './testrun/testrun.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, AuthModule, ProjectModule, TestcaseModule, TestrunModule, DashboardModule],
})
export class AppModule {}
