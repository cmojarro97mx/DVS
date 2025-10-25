import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KnowledgeBaseService } from './knowledge-base.service';

@Injectable()
export class KnowledgeBaseSchedulerService {
  private readonly logger = new Logger(KnowledgeBaseSchedulerService.name);

  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {
    this.logger.log('✅ KnowledgeBaseScheduler inicializado - Procesamiento continuo activo');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processKnowledgeInBackground() {
    try {
      this.logger.log('🤖 Iniciando procesamiento de conocimiento en background...');
      await this.knowledgeBaseService.processOperationsForKnowledge();
      this.logger.log('✅ Procesamiento de conocimiento completado');
    } catch (error) {
      this.logger.error(`❌ Error en procesamiento de conocimiento: ${error.message}`);
    }
  }
}
