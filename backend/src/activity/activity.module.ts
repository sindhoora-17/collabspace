import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service.js';
import { ActivityController } from './activity.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  providers: [ActivityService],
  controllers: [ActivityController],
  exports: [ActivityService]
})
export class ActivityModule {}
