import { Controller, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { KnowledgeBaseService } from './knowledge-base.service';

@Controller('knowledge-base')
@UseGuards(JwtAuthGuard)
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Get('statistics')
  async getStatistics(@Request() req: any) {
    return this.knowledgeBaseService.getStatistics(req.user.organizationId);
  }

  @Get('entries')
  async getEntries(@Request() req: any) {
    return this.knowledgeBaseService.getRelevantKnowledge(
      req.user.organizationId,
      { limit: 100 },
    );
  }

  @Delete('entries/:id')
  async deleteEntry(@Param('id') id: string, @Request() req: any) {
    const deleted = await this.knowledgeBaseService.deleteEntry(
      id,
      req.user.organizationId,
    );
    return { success: deleted };
  }
}
