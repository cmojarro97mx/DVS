import { Module } from '@nestjs/common';
import { EmailSyncService } from './email-sync.service';
import { EmailSyncController } from './email-sync.controller';
import { PrismaService } from '../../common/prisma.service';
import { GoogleAuthModule } from '../google-auth/google-auth.module';
import { EmailStorageModule } from '../email-storage/email-storage.module';
import { EmailStorageService } from '../email-storage/email-storage.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentProcessorService } from './document-processor.service';

@Module({
  imports: [GoogleAuthModule, EmailStorageModule, NotificationsModule],
  controllers: [EmailSyncController],
  providers: [EmailSyncService, EmailStorageService, DocumentProcessorService],
  exports: [EmailSyncService, DocumentProcessorService],
})
export class EmailSyncModule {}
