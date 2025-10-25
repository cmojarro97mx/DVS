import { Module } from '@nestjs/common';
import { TaskAutomationService } from './task-automation.service';
import { TaskAutomationController } from './task-automation.controller';
import { PrismaService } from '../../common/prisma.service';
import { DocumentProcessorService } from '../email-sync/document-processor.service';

@Module({
  controllers: [TaskAutomationController],
  providers: [TaskAutomationService, PrismaService, DocumentProcessorService],
  exports: [TaskAutomationService],
})
export class TaskAutomationModule {}
