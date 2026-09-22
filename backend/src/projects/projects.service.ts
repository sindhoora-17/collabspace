import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    workspaceId: string,
    dto: CreateProjectDto,
  ) {
    await this.ensureWorkspaceMember(userId, workspaceId);

    return this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        workspaceId,
      },
    });
  }

  async findAllForWorkspace(
    userId: string,
    workspaceId: string,
  ) {
    await this.ensureWorkspaceMember(userId, workspaceId);

    return this.prisma.project.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    userId: string,
    workspaceId: string,
    projectId: string,
  ) {
    await this.ensureWorkspaceMember(userId, workspaceId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async ensureWorkspaceMember(
    userId: string,
    workspaceId: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership =
      await this.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this workspace',
      );
    }
  }
}