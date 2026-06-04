import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JoinProjectDto, CreateProjectDto, GenerateJoinCodeDto, CreateProjectModuleDto } from './dto/project.dto';

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

  @Put(':id/members/:memberId/role')
  async updateMemberRole(@Request() req: any, @Param('id') projectId: string, @Param('memberId') memberId: string, @Body('role') role: string) {
    return this.projectService.updateMemberRole(projectId, req.user.userId, memberId, role);
  }

  @Delete(':id/members/:memberId')
  async removeMember(@Request() req: any, @Param('id') projectId: string, @Param('memberId') memberId: string) {
    return this.projectService.removeMember(projectId, req.user.userId, memberId);
  }

  @Post(':id/join-code')
  async generateJoinCode(@Request() req: any, @Param('id') projectId: string, @Body() dto: GenerateJoinCodeDto) {
    return this.projectService.generateJoinCode(projectId, req.user.userId, dto);
  }

  @Get(':id/invitations')
  async getProjectInvitations(
    @Request() req: any, 
    @Param('id') projectId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5'
  ) {
    return this.projectService.getInvitations(projectId, req.user.userId, parseInt(page, 10), parseInt(limit, 10));
  }

  @Post('join')
  async joinProject(@Request() req: any, @Body() dto: JoinProjectDto) {
    return this.projectService.joinProjectWithCode(req.user.userId, dto);
  }

  @Get(':id/modules')
  async getProjectModules(@Param('id') projectId: string) {
    return this.projectService.getProjectModules(projectId);
  }

  @Post(':id/modules')
  async createProjectModule(@Param('id') projectId: string, @Body() dto: CreateProjectModuleDto) {
    return this.projectService.createProjectModule(projectId, dto);
  }
}
