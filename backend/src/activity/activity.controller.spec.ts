import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Test } from '@nestjs/testing';

import { ActivityController } from './activity.controller.js';
import { ActivityService } from './activity.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

describe('ActivityController', () => {
  let controller: ActivityController;

  const activityServiceMock = {
    findByProject: vi.fn(),
  };

  beforeEach(async () => {
    const moduleBuilder =
      Test.createTestingModule({
        controllers: [
          ActivityController,
        ],
        providers: [
          {
            provide: ActivityService,
            useValue:
              activityServiceMock,
          },
        ],
      });

    moduleBuilder
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      });

    const moduleRef =
      await moduleBuilder.compile();

    controller =
      moduleRef.get<ActivityController>(
        ActivityController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});