import { Module, forwardRef } from '@nestjs/common';
import { OperationLinkingRulesService } from './operation-linking-rules.service';
import { OperationLinkingRulesController } from './operation-linking-rules.controller';
import { SmartOperationCreatorService } from './smart-operation-creator.service';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';
import { NotificationsService } from '../notifications/notifications.service';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';

@Module({
  imports: [forwardRef(() => KnowledgeBaseModule)],
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
