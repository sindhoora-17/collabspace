import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { ActivityModule } from '../activity/activity.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    RealtimeModule,
    ActivityModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
