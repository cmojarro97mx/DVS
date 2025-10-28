import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AIClassifierService } from './ai-classifier.service';
import { EmailExtractionService } from './email-extraction.service';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';
import { EmailStorageModule } from '../email-storage/email-storage.module';

@Module({
  imports: [EmailStorageModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    AIClassifierService,
    EmailExtractionService,
    PrismaService,
    BackblazeService,
  ],
  exports: [DocumentsService, AIClassifierService, EmailExtractionService],
})
export class DocumentsModule {}
