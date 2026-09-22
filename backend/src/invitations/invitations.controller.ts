import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { InvitationsService } from './invitations.service.js';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
  };
};

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('workspaces/:workspaceId/invitations')
  create(
    @Param('workspaceId') workspaceId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(
      workspaceId,
      request.user.userId,
      dto,
    );
  }

  @Post('invitations/:token/accept')
  accept(@Param('token') token: string, @Req() request: AuthenticatedRequest) {
    return this.invitationsService.accept(
      token,
      request.user.userId,
      request.user.email,
    );
  }
}
