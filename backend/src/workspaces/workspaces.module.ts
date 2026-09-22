import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { WorkspacesController } from './workspaces.controller.js';
import { WorkspacesService } from './workspaces.service.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    JwtAuthGuard,
  ],
})
export class WorkspacesModule {}