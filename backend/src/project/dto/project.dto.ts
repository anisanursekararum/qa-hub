import { IsNotEmpty, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class JoinProjectDto {
  @IsNotEmpty({ message: 'Join code is required.' })
  @IsString({ message: 'Join code must be a string.' })
  joinCode!: string;
}

export interface JoinProjectResponse {
  message: string;
  projectId: string;
  projectName: string;
  role: Role;
}
