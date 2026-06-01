import { IsString, IsNotEmpty, IsArray, IsOptional, IsIn } from 'class-validator';

export class CreateTestRunDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  environment?: string;
}

export class DuplicateTestRunDto {
  @IsString()
  @IsNotEmpty()
  sourceRunId: string;
}

export class AddTestCasesDto {
  @IsArray()
  @IsString({ each: true })
  testCaseIds: string[];
}

export class RemoveTestCasesDto {
  @IsArray()
  @IsString({ each: true })
  testCaseIds: string[];
}

export class UpdateTestRunItemDto {
  @IsString()
  @IsIn(['TO_DO', 'PASSED', 'FAILED'])
  executionStatus: 'TO_DO' | 'PASSED' | 'FAILED';

  @IsOptional()
  @IsString()
  notes?: string;
}
