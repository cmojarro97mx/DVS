import { Module } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseSchedulerService } from './knowledge-base-scheduler.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService, KnowledgeBaseSchedulerService, PrismaService],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
