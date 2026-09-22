import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { WorkspacesService } from './workspaces.service.js';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
  };
};

@Controller('api/v1/workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(request.user.userId, dto);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.workspacesService.findAllForUser(request.user.userId);
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.findOneForUser(
      request.user.userId,
      workspaceId,
    );
  }

  @Get(':id/members')
  getMembers(
    @Req() request: AuthenticatedRequest,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.getMembers(request.user.userId, workspaceId);
  }
}
