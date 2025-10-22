import { Module } from '@nestjs/common';
import { EmailSyncService } from './email-sync.service';
import { EmailSyncController } from './email-sync.controller';
import { PrismaService } from '../../common/prisma.service';
import { GoogleAuthModule } from '../google-auth/google-auth.module';
import { EmailStorageModule } from '../email-storage/email-storage.module';
import { EmailStorageService } from '../email-storage/email-storage.service';

@Module({
  imports: [GoogleAuthModule, EmailStorageModule],
  controllers: [EmailSyncController],
  providers: [EmailSyncService, EmailStorageService, PrismaService],
  exports: [EmailSyncService],
})
export class EmailSyncModule {}
