import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailStorageService } from './email-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailStorageService],
  exports: [EmailStorageService],
})
export class EmailStorageModule {}
