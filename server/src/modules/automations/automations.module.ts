import { Module } from '@nestjs/common';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [AutomationsController],
  providers: [AutomationsService, PrismaService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
