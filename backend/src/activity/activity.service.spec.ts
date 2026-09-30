import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ActivityService } from './activity.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActivityType } from '../generated/prisma/client.js';

describe('ActivityService', () => {
  let service: ActivityService;

  const prismaMock = {
    activity: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new ActivityService(
      prismaMock as unknown as PrismaService,
    );
  });

  describe('create', () => {
    it('creates an activity with actor and task details', async () => {
      const activity = {
        id: 'activity-1',
        type: ActivityType.TASK_CREATED,
        message: 'created task "Build API"',
        metadata: null,
        projectId: 'project-1',
        actorId: 'user-1',
        taskId: 'task-1',
        actor: {
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'Test User',
        },
        task: {
          id: 'task-1',
          title: 'Build API',
        },
      };

      prismaMock.activity.create.mockResolvedValue(
        activity,
      );

      const result = await service.create({
        type: ActivityType.TASK_CREATED,
        message: 'created task "Build API"',
        projectId: 'project-1',
        actorId: 'user-1',
        taskId: 'task-1',
      });

      expect(
        prismaMock.activity.create,
      ).toHaveBeenCalledWith({
        data: {
          type: ActivityType.TASK_CREATED,
          message: 'created task "Build API"',
          projectId: 'project-1',
          actorId: 'user-1',
          taskId: 'task-1',
          metadata: undefined,
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

      expect(result).toEqual(activity);
    });

    it('passes activity metadata through to Prisma', async () => {
      const metadata = {
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
      };

      prismaMock.activity.create.mockResolvedValue({
        id: 'activity-2',
      });

      await service.create({
        type: ActivityType.TASK_MOVED,
        message:
          'moved "Build API" from TODO to IN_PROGRESS',
        projectId: 'project-1',
        actorId: 'user-1',
        taskId: 'task-1',
        metadata,
      });

      expect(
        prismaMock.activity.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata,
          }),
        }),
      );
    });
  });

  describe('findByProject', () => {
    it('returns the latest 50 activities for a project', async () => {
      const activities = [
        {
          id: 'activity-2',
          createdAt: new Date(
            '2026-09-22T12:00:00Z',
          ),
        },
        {
          id: 'activity-1',
          createdAt: new Date(
            '2026-09-22T11:00:00Z',
          ),
        },
      ];

      prismaMock.activity.findMany.mockResolvedValue(
        activities,
      );

      const result =
        await service.findByProject(
          'project-1',
        );

      expect(
        prismaMock.activity.findMany,
      ).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
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

      expect(result).toEqual(activities);
    });
  });
});