import { Module } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';

@Module({
  controllers: [OperationsController],
  providers: [OperationsService, PrismaService, BackblazeService],
  exports: [OperationsService],
})
export class OperationsModule {}
