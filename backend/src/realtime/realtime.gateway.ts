import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinProject')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      projectId: string;
    },
  ) {
    void client.join(`project:${data.projectId}`);

    return {
      event: 'joinedProject',
      data: {
        projectId: data.projectId,
      },
    };
  }

  emitTaskCreated(projectId: string, task: unknown) {
    this.server.to(`project:${projectId}`).emit('taskCreated', task);
  }

  emitTaskUpdated(projectId: string, task: unknown) {
    this.server.to(`project:${projectId}`).emit('taskUpdated', task);
  }

  emitCommentCreated(projectId: string, comment: unknown) {
    this.server.to(`project:${projectId}`).emit('commentCreated', comment);
  }

  emitActivityCreated(projectId: string, activity: unknown) {
    this.server.to(`project:${projectId}`).emit('activityCreated', activity);
  }

}
