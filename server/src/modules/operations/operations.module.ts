import { Module } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [OperationsController],
  providers: [OperationsService, PrismaService],
  exports: [OperationsService],
})
export class OperationsModule {}
