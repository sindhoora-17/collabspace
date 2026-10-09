import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ActivityService } from './activity.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

type AuthenticatedRequest = {
  user: {
    userId: string;
    email: string;
  };
};

@Controller('api/v1/workspaces/:workspaceId/projects/:projectId/activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
  ) {}

  @Get()
  async getProjectActivity(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.activityService.findByProject(
      workspaceId,
      projectId,
      request.user.userId,
    );
  }
}