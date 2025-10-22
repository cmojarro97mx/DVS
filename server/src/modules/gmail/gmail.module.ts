import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { GoogleAuthModule } from '../google-auth/google-auth.module';

@Module({
  imports: [GoogleAuthModule],
  controllers: [GmailController],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}
