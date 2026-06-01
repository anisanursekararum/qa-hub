import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JoinProjectDto, CreateProjectDto, GenerateJoinCodeDto } from './dto/project.dto';

@Controller('project')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async getUserProjects(@Request() req: any) {
    return this.projectService.getUserProjects(req.user.userId);
  }

  @Post()
  async createProject(@Request() req: any, @Body() dto: CreateProjectDto) {
    return this.projectService.createProject(req.user.userId, dto);
  }

  @Get(':id/members')
  async getProjectMembers(@Request() req: any, @Param('id') projectId: string) {
    return this.projectService.getProjectMembers(projectId, req.user.userId);
  }

  @Post(':id/join-code')
  async generateJoinCode(@Request() req: any, @Param('id') projectId: string, @Body() dto: GenerateJoinCodeDto) {
    return this.projectService.generateJoinCode(projectId, req.user.userId, dto);
  }

  @Post('join')
  async joinProject(@Request() req: any, @Body() dto: JoinProjectDto) {
    return this.projectService.joinProjectWithCode(req.user.userId, dto);
  }
}
