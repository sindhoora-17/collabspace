import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { ActivityType, Prisma } from '../generated/prisma/client.js';

type CreateActivityInput = {
  type: ActivityType;
  message: string;

  projectId: string;
  actorId: string;

  taskId?: string;

  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateActivityInput) {
    return this.prisma.activity.create({
      data: {
        type: input.type,
        message: input.message,

        projectId: input.projectId,
        actorId: input.actorId,

        taskId: input.taskId,

        metadata: input.metadata,
      },

      include: {
        actor: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },

        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async findByProject(workspaceId: string, projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.activity.findMany({
      where: {
        projectId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 50,

      include: {
        actor: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },

        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }
}
