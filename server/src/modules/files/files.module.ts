import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, BackblazeService],
  exports: [FilesService],
})
export class FilesModule {}
