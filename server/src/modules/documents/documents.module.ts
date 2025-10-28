import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService, BackblazeService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
