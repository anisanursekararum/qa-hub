import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { CaseStatus, CasePriority } from '@prisma/client';

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

  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;
}

export class UpdateTestCaseDto extends CreateTestCaseDto {}

export class BulkImportItemDto {
  @IsNotEmpty()
  @IsString()
  moduleName!: string;

  @IsNotEmpty()
  @IsString()
  moduleCode!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

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

  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkImportTestCaseDto {
  @IsNotEmpty()
  @IsString()
  fileName!: string;

  @IsNotEmpty()
  items!: BulkImportItemDto[];
}
