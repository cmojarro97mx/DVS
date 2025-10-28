import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AIClassifierService } from './ai-classifier.service';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, AIClassifierService, PrismaService, BackblazeService],
  exports: [DocumentsService, AIClassifierService],
})
export class DocumentsModule {}
