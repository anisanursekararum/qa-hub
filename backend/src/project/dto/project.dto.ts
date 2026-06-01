import { IsNotEmpty, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class JoinProjectDto {
  @IsNotEmpty({ message: 'Join code is required.' })
  @IsString({ message: 'Join code must be a string.' })
  joinCode!: string;
}

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsString()
  description!: string;
}

export class GenerateJoinCodeDto {
  @IsNotEmpty()
  @IsString()
  email!: string;
}

export interface JoinProjectResponse {
  message: string;
  projectId: string;
  projectName: string;
  role: Role;
}

export class CreateProjectModuleDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;
}
