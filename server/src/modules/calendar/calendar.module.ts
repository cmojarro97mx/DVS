import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CalendarController],
  providers: [CalendarService, PrismaService],
  exports: [CalendarService],
})
export class CalendarModule {}
