import { Module } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailSyncModule } from '../email-sync/email-sync.module';
import { EmailStorageModule } from '../email-storage/email-storage.module';

@Module({
  imports: [NotificationsModule, EmailSyncModule, EmailStorageModule],
  controllers: [OperationsController],
  providers: [OperationsService, PrismaService, BackblazeService],
  exports: [OperationsService],
})
export class OperationsModule {}
