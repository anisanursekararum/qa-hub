import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { CaseStatus } from '@prisma/client';

export class CreateTestCaseDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  moduleId!: string;

  @IsOptional()
  @IsString()
  prerequisite?: string;

  @IsNotEmpty()
  @IsString()
  steps!: string;

  @IsOptional()
  @IsString()
  expectedResult?: string;

  @IsBoolean()
  hasAutomation!: boolean;
}

export class UpdateTestCaseDto extends CreateTestCaseDto {
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;
}
