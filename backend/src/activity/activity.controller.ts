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
    @Param('projectId') projectId: string,
    @Req() _request: AuthenticatedRequest,
  ) {
    return this.activityService.findByProject(projectId);
  }
}