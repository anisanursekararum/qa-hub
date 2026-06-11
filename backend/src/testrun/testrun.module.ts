import { Module } from '@nestjs/common';
import { TestrunService } from './testrun.service';
import { TestrunController } from './testrun.controller';
import { TestRunGateway } from './testrun/testrun.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TestrunService, TestRunGateway],
  controllers: [TestrunController],
  exports: [TestRunGateway],
})
export class TestrunModule {}
