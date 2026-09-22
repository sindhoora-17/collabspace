import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async accept(token: string, userId: string, userEmail: string) {
  const invitation = await this.prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    throw new NotFoundException('Invitation not found');
  }

  if (invitation.acceptedAt) {
    throw new BadRequestException('Invitation has already been accepted');
  }

  if (invitation.expiresAt <= new Date()) {
    throw new BadRequestException('Invitation has expired');
  }

  if (invitation.email !== userEmail.trim().toLowerCase()) {
    throw new ForbiddenException(
      'This invitation was sent to a different email address',
    );
  }

  const existingMembership =
    await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: invitation.workspaceId,
        },
      },
    });

  if (existingMembership) {
    throw new BadRequestException(
      'You are already a member of this workspace',
    );
  }

  return this.prisma.$transaction(async (tx) => {
    const membership = await tx.workspaceMember.create({
      data: {
        userId,
        workspaceId: invitation.workspaceId,
        role: 'MEMBER',
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await tx.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        acceptedAt: new Date(),
      },
    });

    return membership;
  });
}

  async create(
    workspaceId: string,
    userId: string,
    dto: CreateInvitationDto,
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

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only workspace owners and admins can invite members',
      );
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMembership =
        await this.prisma.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: existingUser.id,
              workspaceId,
            },
          },
        });

      if (existingMembership) {
        throw new BadRequestException(
          'This user is already a member of the workspace',
        );
      }
    }

    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        workspaceId,
        email,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      throw new BadRequestException(
        'An active invitation already exists for this email',
      );
    }

    const token = randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.invitation.create({
      data: {
        email,
        token,
        expiresAt,
        workspaceId,
        invitedById: userId,
      },
      select: {
        id: true,
        email: true,
        token: true,
        expiresAt: true,
        createdAt: true,
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}