import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { ActivityModule } from '../activity/activity.module.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    RealtimeModule,
    ActivityModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
