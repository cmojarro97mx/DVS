import { Module } from '@nestjs/common';
import { VirtualAssistantService } from './virtual-assistant.service';
import { VirtualAssistantController } from './virtual-assistant.controller';
import { VirtualAssistantGateway } from './virtual-assistant.gateway';
import { AssistantToolsService } from './assistant-tools.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  providers: [
    VirtualAssistantService,
    VirtualAssistantGateway,
    AssistantToolsService,
    PrismaService,
  ],
  controllers: [VirtualAssistantController],
  exports: [VirtualAssistantService],
})
export class VirtualAssistantModule {}
