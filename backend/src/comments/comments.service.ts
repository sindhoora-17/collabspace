import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityType } from '../generated/prisma/client.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly activityService: ActivityService,
  ) {}

  async create(
    userId: string,
    workspaceId: string,
    projectId: string,
    taskId: string,
    dto: CreateCommentDto,
  ) {
    const task = await this.ensureTaskAccess(
      userId,
      workspaceId,
      projectId,
      taskId,
    );

    const comment = await this.prisma.comment.create({
      data: {
        body: dto.body.trim(),
        taskId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    const activity = await this.activityService.create({
      type: ActivityType.COMMENT_ADDED,
      message: `commented on "${task.title}"`,
      projectId,
      actorId: userId,
      taskId,
    });

    this.realtimeGateway.emitActivityCreated(projectId, activity);

    this.realtimeGateway.emitCommentCreated(projectId, {
      ...comment,
      taskId,
    });

    return comment;
  }

  async findAll(
    userId: string,
    workspaceId: string,
    projectId: string,
    taskId: string,
  ) {
    await this.ensureTaskAccess(userId, workspaceId, projectId, taskId);

    return this.prisma.comment.findMany({
      where: {
        taskId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  private async ensureTaskAccess(
    userId: string,
    workspaceId: string,
    projectId: string,
    taskId: string,
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        project: {
          workspaceId,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }
}
