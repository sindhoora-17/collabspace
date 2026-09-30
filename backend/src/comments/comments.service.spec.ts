import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { CommentsService } from './comments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityType } from '../generated/prisma/client.js';

describe('CommentsService', () => {
  let service: CommentsService;

  const prismaMock = {
    workspaceMember: {
      findUnique: vi.fn(),
    },

    task: {
      findFirst: vi.fn(),
    },

    comment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  const realtimeGatewayMock = {
    emitActivityCreated: vi.fn(),
    emitCommentCreated: vi.fn(),
  };

  const activityServiceMock = {
    create: vi.fn(),
  };

  const userId = 'user-1';
  const workspaceId = 'workspace-1';
  const projectId = 'project-1';
  const taskId = 'task-1';

  beforeEach(() => {
    vi.clearAllMocks();

    service = new CommentsService(
      prismaMock as unknown as PrismaService,
      realtimeGatewayMock as unknown as RealtimeGateway,
      activityServiceMock as unknown as ActivityService,
    );

    prismaMock.workspaceMember.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      workspaceId,
    });

    prismaMock.task.findFirst.mockResolvedValue({
      id: taskId,
      title: 'Build comments',
      projectId,
    });
  });

  describe('create', () => {
    it('creates a comment, records activity, and emits realtime events', async () => {
      const comment = {
        id: 'comment-1',
        body: 'Looks good',
        taskId,
        authorId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: userId,
          email: 'user@example.com',
          displayName: 'Test User',
        },
      };

      const activity = {
        id: 'activity-1',
        type: ActivityType.COMMENT_ADDED,
        projectId,
        taskId,
      };

      prismaMock.comment.create.mockResolvedValue(
        comment,
      );

      activityServiceMock.create.mockResolvedValue(
        activity,
      );

      const result = await service.create(
        userId,
        workspaceId,
        projectId,
        taskId,
        {
          body: '  Looks good  ',
        },
      );

      expect(
        prismaMock.comment.create,
      ).toHaveBeenCalledWith({
        data: {
          body: 'Looks good',
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

      expect(
        activityServiceMock.create,
      ).toHaveBeenCalledWith({
        type: ActivityType.COMMENT_ADDED,
        message:
          'commented on "Build comments"',
        projectId,
        actorId: userId,
        taskId,
      });

      expect(
        realtimeGatewayMock.emitActivityCreated,
      ).toHaveBeenCalledWith(
        projectId,
        activity,
      );

      expect(
        realtimeGatewayMock.emitCommentCreated,
      ).toHaveBeenCalledWith(
        projectId,
        {
          ...comment,
          taskId,
        },
      );

      expect(result).toEqual(comment);
    });
  });

  describe('findAll', () => {
    it('returns comments ordered by creation time', async () => {
      const comments = [
        {
          id: 'comment-1',
          body: 'First',
        },
        {
          id: 'comment-2',
          body: 'Second',
        },
      ];

      prismaMock.comment.findMany.mockResolvedValue(
        comments,
      );

      const result = await service.findAll(
        userId,
        workspaceId,
        projectId,
        taskId,
      );

      expect(
        prismaMock.comment.findMany,
      ).toHaveBeenCalledWith({
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

      expect(result).toEqual(comments);
    });
  });

  describe('access control', () => {
    it('rejects a user who is not a workspace member', async () => {
      prismaMock.workspaceMember.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.findAll(
          userId,
          workspaceId,
          projectId,
          taskId,
        ),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(
        prismaMock.comment.findMany,
      ).not.toHaveBeenCalled();
    });

    it('rejects a missing task', async () => {
      prismaMock.task.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.findAll(
          userId,
          workspaceId,
          projectId,
          taskId,
        ),
      ).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(
        prismaMock.comment.findMany,
      ).not.toHaveBeenCalled();
    });
  });
});