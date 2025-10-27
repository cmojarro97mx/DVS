import { Module } from '@nestjs/common';
import { OperationLinkingRulesService } from './operation-linking-rules.service';
import { OperationLinkingRulesController } from './operation-linking-rules.controller';
import { SmartOperationCreatorService } from './smart-operation-creator.service';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [OperationLinkingRulesController],
  providers: [
    OperationLinkingRulesService,
    SmartOperationCreatorService,
    PrismaService,
    BackblazeService,
    NotificationsService,
  ],
  exports: [OperationLinkingRulesService, SmartOperationCreatorService],
})
export class OperationLinkingRulesModule {}
