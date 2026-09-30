import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityType } from '../generated/prisma/client.js';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly activityService: ActivityService,
  ) {}

  async create(
    userId: string,
    workspaceId: string,
    projectId: string,
    dto: CreateTaskDto,
  ) {
    await this.ensureProjectAccess(userId, workspaceId, projectId);

    if (dto.assigneeId) {
      await this.ensureAssigneeIsWorkspaceMember(dto.assigneeId, workspaceId);
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        status: dto.status ?? 'TODO',
        priority: dto.priority ?? 'MEDIUM',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assigneeId: dto.assigneeId,
        position: dto.position ?? 0,
        projectId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    const activity = await this.activityService.create({
      type: ActivityType.TASK_CREATED,
      message: `created task "${task.title}"`,
      projectId,
      actorId: userId,
      taskId: task.id,
    });

    this.realtimeGateway.emitActivityCreated(projectId, activity);

    this.realtimeGateway.emitTaskCreated(projectId, task);

    return task;
  }

  async findAll(userId: string, workspaceId: string, projectId: string) {
    await this.ensureProjectAccess(userId, workspaceId, projectId);

    return this.prisma.task.findMany({
      where: {
        projectId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: [
        {
          status: 'asc',
        },
        {
          position: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });
  }

  async update(
    userId: string,
    workspaceId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    await this.ensureProjectAccess(userId, workspaceId, projectId);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (dto.assigneeId) {
      await this.ensureAssigneeIsWorkspaceMember(dto.assigneeId, workspaceId);
    }

    const updatedTask = await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title: dto.title?.trim(),

        description:
          dto.description === undefined
            ? undefined
            : dto.description?.trim() || null,

        status: dto.status,

        priority: dto.priority,

        dueDate:
          dto.dueDate === undefined
            ? undefined
            : dto.dueDate
              ? new Date(dto.dueDate)
              : null,

        assigneeId: dto.assigneeId,

        position: dto.position,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    const statusChanged = task.status !== updatedTask.status;

    if (statusChanged) {
      const activity = await this.activityService.create({
        type: ActivityType.TASK_MOVED,
        message: `moved "${updatedTask.title}" from ${task.status} to ${updatedTask.status}`,
        projectId,
        actorId: userId,
        taskId: updatedTask.id,
        metadata: {
          fromStatus: task.status,
          toStatus: updatedTask.status,
        },
      });
      this.realtimeGateway.emitActivityCreated(projectId, activity);
    } else {
      const activity = await this.activityService.create({
        type: ActivityType.TASK_UPDATED,
        message: `updated task "${updatedTask.title}"`,
        projectId,
        actorId: userId,
        taskId: updatedTask.id,
      });
      this.realtimeGateway.emitActivityCreated(projectId, activity);
    }

    this.realtimeGateway.emitTaskUpdated(projectId, updatedTask);

    return updatedTask;
  }

  async remove(
    userId: string,
    workspaceId: string,
    projectId: string,
    taskId: string,
  ) {
    await this.ensureProjectAccess(userId, workspaceId, projectId);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const activity = await this.activityService.create({
      type: ActivityType.TASK_DELETED,
      message: `deleted task "${task.title}"`,
      projectId,
      actorId: userId,
      taskId: task.id,
      metadata: {
        taskTitle: task.title,
      },
    });

    this.realtimeGateway.emitActivityCreated(projectId, activity);

    await this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });
    this.realtimeGateway.emitTaskDeleted(projectId, taskId);
    return {
      success: true,
      taskId,
    };
  }

  private async ensureProjectAccess(
    userId: string,
    workspaceId: string,
    projectId: string,
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

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async ensureAssigneeIsWorkspaceMember(
    assigneeId: string,
    workspaceId: string,
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: assigneeId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException(
        'Assignee must be a member of the workspace',
      );
    }
  }
}
