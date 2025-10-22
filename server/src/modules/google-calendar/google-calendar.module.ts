import { Module } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleAuthModule } from '../google-auth/google-auth.module';
import { PrismaService } from '../../common/prisma.service';

@Module({
  imports: [GoogleAuthModule],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService, PrismaService],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
