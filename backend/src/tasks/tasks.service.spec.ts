import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TaskPriorityDto, TaskStatusDto } from './dto/create-task.dto.js';

import { TasksService } from './tasks.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityType } from '../generated/prisma/client.js';

describe('TasksService', () => {
  let service: TasksService;

  const prismaMock = {
    workspaceMember: {
      findUnique: vi.fn(),
    },

    project: {
      findFirst: vi.fn(),
    },

    task: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  const realtimeGatewayMock = {
    emitTaskCreated: vi.fn(),
    emitTaskUpdated: vi.fn(),
    emitTaskDeleted: vi.fn(),
    emitActivityCreated: vi.fn(),
  };

  const activityServiceMock = {
    create: vi.fn(),
  };

  const userId = 'user-1';
  const workspaceId = 'workspace-1';
  const projectId = 'project-1';

  beforeEach(() => {
    vi.clearAllMocks();

    service = new TasksService(
      prismaMock as unknown as PrismaService,
      realtimeGatewayMock as unknown as RealtimeGateway,
      activityServiceMock as unknown as ActivityService,
    );

    prismaMock.workspaceMember.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      workspaceId,
    });

    prismaMock.project.findFirst.mockResolvedValue({
      id: projectId,
      workspaceId,
      name: 'Test Project',
    });
  });

  describe('create', () => {
    it('creates a task, records activity, and emits realtime events', async () => {
      const task = {
        id: 'task-1',
        title: 'Build activity feed',
        description: 'Add project history',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: null,
        position: 0,
        projectId,
        assigneeId: null,
        assignee: null,
      };

      const activity = {
        id: 'activity-1',
        type: ActivityType.TASK_CREATED,
        projectId,
        taskId: task.id,
      };

      prismaMock.task.create.mockResolvedValue(task);
      activityServiceMock.create.mockResolvedValue(activity);

      const result = await service.create(userId, workspaceId, projectId, {
        title: '  Build activity feed  ',
        description: '  Add project history  ',
        priority: TaskPriorityDto.HIGH,
      });

      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Build activity feed',
          description: 'Add project history',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: undefined,
          assigneeId: undefined,
          position: 0,
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

      expect(activityServiceMock.create).toHaveBeenCalledWith({
        type: ActivityType.TASK_CREATED,
        message: 'created task "Build activity feed"',
        projectId,
        actorId: userId,
        taskId: task.id,
      });

      expect(realtimeGatewayMock.emitActivityCreated).toHaveBeenCalledWith(
        projectId,
        activity,
      );

      expect(realtimeGatewayMock.emitTaskCreated).toHaveBeenCalledWith(
        projectId,
        task,
      );

      expect(result).toEqual(task);
    });
  });

  describe('update', () => {
    it('records TASK_MOVED when task status changes', async () => {
      const existingTask = {
        id: 'task-1',
        title: 'Build API',
        status: 'TODO',
      };

      const updatedTask = {
        ...existingTask,
        status: 'IN_PROGRESS',
        assignee: null,
      };

      const activity = {
        id: 'activity-1',
        type: ActivityType.TASK_MOVED,
      };

      prismaMock.task.findFirst.mockResolvedValue(existingTask);

      prismaMock.task.update.mockResolvedValue(updatedTask);

      activityServiceMock.create.mockResolvedValue(activity);

      const result = await service.update(
        userId,
        workspaceId,
        projectId,
        'task-1',
        {
          status: TaskStatusDto.IN_PROGRESS,
        },
      );

      expect(activityServiceMock.create).toHaveBeenCalledWith({
        type: ActivityType.TASK_MOVED,
        message: 'moved "Build API" from TODO to IN_PROGRESS',
        projectId,
        actorId: userId,
        taskId: 'task-1',
        metadata: {
          fromStatus: 'TODO',
          toStatus: 'IN_PROGRESS',
        },
      });

      expect(realtimeGatewayMock.emitActivityCreated).toHaveBeenCalledWith(
        projectId,
        activity,
      );

      expect(realtimeGatewayMock.emitTaskUpdated).toHaveBeenCalledWith(
        projectId,
        updatedTask,
      );

      expect(result).toEqual(updatedTask);
    });

    it('records TASK_UPDATED when status does not change', async () => {
      const existingTask = {
        id: 'task-1',
        title: 'Old title',
        status: 'TODO',
      };

      const updatedTask = {
        id: 'task-1',
        title: 'New title',
        status: 'TODO',
        assignee: null,
      };

      const activity = {
        id: 'activity-2',
        type: ActivityType.TASK_UPDATED,
      };

      prismaMock.task.findFirst.mockResolvedValue(existingTask);

      prismaMock.task.update.mockResolvedValue(updatedTask);

      activityServiceMock.create.mockResolvedValue(activity);

      await service.update(userId, workspaceId, projectId, 'task-1', {
        title: 'New title',
      });

      expect(activityServiceMock.create).toHaveBeenCalledWith({
        type: ActivityType.TASK_UPDATED,
        message: 'updated task "New title"',
        projectId,
        actorId: userId,
        taskId: 'task-1',
      });

      expect(realtimeGatewayMock.emitTaskUpdated).toHaveBeenCalledWith(
        projectId,
        updatedTask,
      );
    });
  });

  describe('remove', () => {
    it('records delete activity, deletes the task, and emits realtime events', async () => {
      const task = {
        id: 'task-1',
        title: 'Delete me',
        projectId,
      };

      const activity = {
        id: 'activity-delete-1',
        type: ActivityType.TASK_DELETED,
      };

      prismaMock.task.findFirst.mockResolvedValue(task);

      activityServiceMock.create.mockResolvedValue(activity);

      prismaMock.task.delete.mockResolvedValue({
        id: 'task-1',
      });

      const result = await service.remove(
        userId,
        workspaceId,
        projectId,
        'task-1',
      );

      expect(activityServiceMock.create).toHaveBeenCalledWith({
        type: ActivityType.TASK_DELETED,
        message: 'deleted task "Delete me"',
        projectId,
        actorId: userId,
        taskId: 'task-1',
        metadata: {
          taskTitle: 'Delete me',
        },
      });

      expect(realtimeGatewayMock.emitActivityCreated).toHaveBeenCalledWith(
        projectId,
        activity,
      );

      expect(prismaMock.task.delete).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
        },
      });

      expect(realtimeGatewayMock.emitTaskDeleted).toHaveBeenCalledWith(
        projectId,
        'task-1',
      );

      expect(result).toEqual({
        success: true,
        taskId: 'task-1',
      });
    });

    it('throws when the task does not exist', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(userId, workspaceId, projectId, 'missing-task'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prismaMock.task.delete).not.toHaveBeenCalled();

      expect(realtimeGatewayMock.emitTaskDeleted).not.toHaveBeenCalled();
    });
  });

  describe('access control', () => {
    it('rejects a user who is not a workspace member', async () => {
      prismaMock.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findAll(userId, workspaceId, projectId),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
    });

    it('rejects an invalid project', async () => {
      prismaMock.project.findFirst.mockResolvedValue(null);

      await expect(
        service.findAll(userId, workspaceId, projectId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an assignee who is not a workspace member', async () => {
      prismaMock.workspaceMember.findUnique
        .mockResolvedValueOnce({
          id: 'membership-1',
          userId,
          workspaceId,
        })
        .mockResolvedValueOnce(null);

      await expect(
        service.create(userId, workspaceId, projectId, {
          title: 'Assigned task',
          assigneeId: 'invalid-user',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });
  });
});
