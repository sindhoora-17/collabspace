import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

import type { Server, Socket } from 'socket.io';

import { PrismaService } from '../prisma/prisma.service.js';

type JwtPayload = {
  userId: string;
  email: string;
};

@WebSocketGateway({
  cors: {
    origin: (
      process.env.FRONTEND_URLS ??
      process.env.FRONTEND_URL ??
      'http://localhost:5173'
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),

    credentials: true,
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @SubscribeMessage('joinProject')
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      projectId: string;
    },
  ) {
    const token = client.handshake.auth?.token;

    if (
      !token ||
      typeof token !== 'string'
    ) {
      throw new WsException(
        'Unauthorized',
      );
    }

    let payload: JwtPayload;

    try {
      payload =
        await this.jwtService.verifyAsync<JwtPayload>(
          token,
        );
    } catch {
      throw new WsException(
        'Unauthorized',
      );
    }

    const project =
      await this.prisma.project.findFirst({
        where: {
          id: data.projectId,

          workspace: {
            members: {
              some: {
                userId: payload.userId,
              },
            },
          },
        },

        select: {
          id: true,
        },
      });

    if (!project) {
      throw new WsException(
        'Project not found',
      );
    }

    await client.join(
      `project:${data.projectId}`,
    );

    return {
      event: 'joinedProject',

      data: {
        projectId: data.projectId,
      },
    };
  }

  emitTaskCreated(
    projectId: string,
    task: unknown,
  ) {
    this.server
      .to(`project:${projectId}`)
      .emit('taskCreated', task);
  }

  emitTaskUpdated(
    projectId: string,
    task: unknown,
  ) {
    this.server
      .to(`project:${projectId}`)
      .emit('taskUpdated', task);
  }

  emitCommentCreated(
    projectId: string,
    comment: unknown,
  ) {
    this.server
      .to(`project:${projectId}`)
      .emit(
        'commentCreated',
        comment,
      );
  }

  emitActivityCreated(
    projectId: string,
    activity: unknown,
  ) {
    this.server
      .to(`project:${projectId}`)
      .emit(
        'activityCreated',
        activity,
      );
  }

  emitTaskDeleted(
    projectId: string,
    taskId: string,
  ) {
    this.server
      .to(`project:${projectId}`)
      .emit('taskDeleted', {
        taskId,
      });
  }
}