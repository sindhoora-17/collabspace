import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { InvitationsModule } from './invitations/invitations.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { WorkspacesModule } from './workspaces/workspaces.module.js';
import { ActivityModule } from './activity/activity.module.js';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    AuthModule,
    WorkspacesModule,
    InvitationsModule,
    CommentsModule,
    RealtimeModule,
    TasksModule,
    ActivityModule,
  ],
  controllers: [AppController],
})
export class AppModule {}