import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JoinProjectDto, JoinProjectResponse, CreateProjectDto, GenerateJoinCodeDto } from './dto/project.dto';
import { Role, ProjectMember } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) { }

  /**
  * Handles validation of the Join Code (OTP) and grants user membership to a project workspace.
  * Enforces OTP brute-force limits: locking the account for 1 hour after 3 failed entry attempts.
  */
  async joinProjectWithCode(userId: string, dto: JoinProjectDto): Promise<JoinProjectResponse> {
    const sanitizedCode = dto.joinCode.trim();

    // 1. Fetch user to verify account status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const now = new Date();

    // 2. Enforce active lockout gate
    if (user.disabledUntil && user.disabledUntil > now) {
      const remainingMinutes = Math.ceil(
        (user.disabledUntil.getTime() - now.getTime()) / (1000 * 60),
      );
      throw new ForbiddenException(
        `This account is locked due to multiple failed join attempts. Please try again in ${remainingMinutes} minutes.`,
      );
    }

    // 3. Query the project invitation record
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { joinCode: sanitizedCode },
      include: { project: true },
    });

    // 4. Check if invitation is valid, unused, and within the 3-hour expiry lifespan
    const isInvitationNotFound = !invitation;
    const isInvitationAlreadyUsed = invitation?.isUsed === true;
    const isInvitationExpired = invitation ? now > invitation.expiredAt : false;

    if (isInvitationNotFound || isInvitationAlreadyUsed || isInvitationExpired) {
      const maxAttemptsAllowed = 3;

      // 1. Perform atomic database-level increment to block parallel read/write bypasses
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          attempts: { increment: 1 },
        },
      });

      if (updatedUser.attempts >= maxAttemptsAllowed) {
        const lockDurationHours = 1;
        const disabledUntil = new Date(now.getTime() + lockDurationHours * 60 * 60 * 1000);

        // Lock user account and reset attempt counter
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            attempts: 0,
            disabledUntil,
          },
        });

        throw new ForbiddenException(
          `Maximum validation attempts reached. Your account has been locked for 1 hour.`,
        );
      } else {
        const attemptsLeft = maxAttemptsAllowed - updatedUser.attempts;
        let errorMessage = 'Invalid join code.';
        if (isInvitationAlreadyUsed) {
          errorMessage = 'This invitation code has already been used.';
        } else if (isInvitationExpired) {
          errorMessage = 'This invitation code has expired (3-hour limit reached).';
        }

        throw new BadRequestException(
          `${errorMessage} Access locked in ${attemptsLeft} more failed attempt(s).`,
        );
      }
    }

    // 5. Ensure invitation exists at this point
    const activeInvitation = invitation!;

    // 6. Check if user is already a member of the project
    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: activeInvitation.projectId,
          userId,
        },
      },
    });

    if (existingMember) {
      // Do not increment failed attempts for already-joined memberships, but reset count on valid interaction
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          attempts: 0,
          disabledUntil: null,
        },
      });
      throw new ConflictException('You are already a member of this project.');
    }

    // 7. Establish transaction to register user membership and mark invitation as used
    const result = await this.prisma.$transaction(async (tx) => {
      // Atomically check and mark code as redeemed.
      // updateMany returns the count of affected rows. If 0, another parallel process has already redeemed it.
      const updatedInvitation = await tx.projectInvitation.updateMany({
        where: {
          id: activeInvitation.id,
          isUsed: false,
        },
        data: { isUsed: true },
      });

      if (updatedInvitation.count === 0) {
        throw new ConflictException(
          'This invitation code has already been redeemed by another process.',
        );
      }

      // Add user to the project as a MEMBER
      const member = await tx.projectMember.create({
        data: {
          projectId: activeInvitation.projectId,
          userId,
          role: Role.MEMBER,
        },
        include: {
          project: true,
        },
      });

      // Clear any historic attempts since registration completed successfully
      await tx.user.update({
        where: { id: userId },
        data: {
          attempts: 0,
          disabledUntil: null,
        },
      });

      return member;
    });

    return {
      message: 'Successfully joined the project workspace.',
      projectId: result.projectId,
      projectName: result.project.name,
      role: result.role,
    };
  }

  async getUserProjects(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            members: true,
          }
        },
      },
      orderBy: { project: { createdAt: 'desc' } }
    });

    return memberships.map(m => ({
      id: m.project.id,
      name: m.project.name,
      description: m.project.description,
      role: m.role,
      teamSize: m.project.members.length,
    }));
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description || 'A newly created workspace.',
        members: {
          create: {
            userId,
            role: Role.ADMIN_PROJECT,
          }
        }
      },
      include: {
        members: true,
      }
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      role: Role.ADMIN_PROJECT,
      teamSize: 1,
    };
  }

  async getProjectMembers(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } }
    });
    if (!member) throw new ForbiddenException('You do not have access to this project.');

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { user: { name: 'asc' } }
    });

    return members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));
  }

  async generateJoinCode(projectId: string, adminId: string, dto: GenerateJoinCodeDto) {
    const admin = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: adminId } }
    });
    if (!admin || admin.role !== Role.ADMIN_PROJECT) {
      throw new ForbiddenException('Only project admins can generate join codes.');
    }

    let code = '';
    let isUnique = false;
    while (!isUnique) {
      code = crypto.randomBytes(3).toString('hex').toUpperCase();
      const existing = await this.prisma.projectInvitation.findUnique({ where: { joinCode: code } });
      if (!existing) isUnique = true;
    }

    const invitation = await this.prisma.projectInvitation.create({
      data: {
        projectId,
        email: dto.email,
        joinCode: code,
        expiredAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
      }
    });

    return invitation;
  }
  async getProjectModules(projectId: string) {
    return this.prisma.projectModule.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  async createProjectModule(projectId: string, dto: { name: string; code: string }) {
    // Basic formatting: ensure code is uppercase and has no special chars
    const code = dto.code.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    
    // Ensure uniqueness
    const existing = await this.prisma.projectModule.findFirst({
      where: { projectId, code }
    });
    if (existing) {
      throw new ConflictException(`A module with code ${code} already exists in this project.`);
    }

    return this.prisma.projectModule.create({
      data: {
        projectId,
        name: dto.name,
        code,
      },
    });
  }

  async getInvitations(projectId: string, userId: string, page: number = 1, limit: number = 5) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member || member.role !== Role.ADMIN_PROJECT) {
      throw new ForbiddenException('Only project admins can view join codes.');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.projectInvitation.findMany({
        where: {
          projectId,
          isUsed: false,
          expiredAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.projectInvitation.count({
        where: {
          projectId,
          isUsed: false,
          expiredAt: { gt: new Date() },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
