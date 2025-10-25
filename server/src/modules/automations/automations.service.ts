import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { DocumentProcessorService } from '../email-sync/document-processor.service';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private prisma: PrismaService,
    private documentProcessor: DocumentProcessorService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.automation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const automation = await this.prisma.automation.findFirst({
      where: { id, organizationId },
    });

    if (!automation) {
      throw new NotFoundException(`Automation with ID ${id} not found`);
    }

    return automation;
  }

  async create(data: any, organizationId: string) {
    return this.prisma.automation.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    const automation = await this.findOne(id, organizationId);

    return this.prisma.automation.update({
      where: { id: automation.id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const automation = await this.findOne(id, organizationId);

    await this.prisma.automation.delete({
      where: { id: automation.id },
    });

    return { success: true };
  }

  async toggleEnabled(id: string, organizationId: string) {
    const automation = await this.findOne(id, organizationId);

    return this.prisma.automation.update({
      where: { id: automation.id },
      data: { enabled: !automation.enabled },
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoLinkEmailsToOperations() {
    this.logger.log('🤖 Iniciando vinculación automática de emails a operaciones...');
    
    try {
      // Buscar todas las automaciones activas
      const automations = await this.prisma.automation.findMany({
        where: {
          type: 'email_to_operation',
          enabled: true,
        },
      });

      if (automations.length === 0) {
        this.logger.log('No hay automaciones activas para procesar');
        return;
      }

      // Agrupar automaciones por organización
      const orgAutomations = new Map<string, any[]>();
      for (const automation of automations) {
        const orgId = automation.organizationId;
        if (!orgAutomations.has(orgId)) {
          orgAutomations.set(orgId, []);
        }
        orgAutomations.get(orgId)!.push(automation);
      }

      let totalLinked = 0;

      // Procesar cada organización
      for (const [orgId, orgAutomationList] of orgAutomations.entries()) {
        try {
          const linked = await this.processOrganizationAutomations(orgId, orgAutomationList);
          totalLinked += linked;
          this.logger.log(`✅ Organización ${orgId}: ${linked} emails vinculados`);
        } catch (error) {
          this.logger.error(`Error procesando organización ${orgId}:`, error.message);
        }
      }

      this.logger.log(`🎉 Vinculación automática completada: ${totalLinked} emails vinculados en total`);
    } catch (error) {
      this.logger.error('Error en vinculación automática:', error);
    }
  }

  private async processOrganizationAutomations(organizationId: string, automations: any[]): Promise<number> {
    let linkedCount = 0;

    // Obtener todas las cuentas de email de la organización
    const emailAccounts = await this.prisma.email_accounts.findMany({
      where: {
        user: {
          organizationId,
        },
        status: 'connected',
        syncEmail: true,
      },
      select: {
        id: true,
      },
    });

    if (emailAccounts.length === 0) {
      return 0;
    }

    const accountIds = emailAccounts.map(a => a.id);

    // Obtener todas las operaciones de la organización que no tienen muchos emails vinculados
    const operations = await this.prisma.operations.findMany({
      where: {
        organizationId,
        status: { notIn: ['cancelled', 'completed'] },
      },
      include: {
        clients: {
          select: {
            email: true,
          },
        },
      },
      take: 100, // Procesar máximo 100 operaciones por ejecución
    });

    this.logger.log(`Procesando ${operations.length} operaciones para organización ${organizationId}`);

    // Procesar cada operación
    for (const operation of operations) {
      try {
        const linked = await this.linkEmailsToOperation(operation, automations, accountIds);
        linkedCount += linked;
      } catch (error) {
        this.logger.error(`Error vinculando emails a operación ${operation.id}:`, error.message);
      }
    }

    return linkedCount;
  }

  private async linkEmailsToOperation(operation: any, automations: any[], accountIds: string[]): Promise<number> {
    const searchConditions = [];
    let useClientEmail = false;
    let useBookingTracking = false;
    let useMBL = false;
    let useHBL = false;
    let useOperationId = false;
    let searchInAttachments = true;

    for (const automation of automations) {
      const config = automation.conditions as any;
      
      if (config?.useClientEmail !== false) {
        useClientEmail = true;
      }
      if (config?.useBookingTracking !== false) {
        useBookingTracking = true;
      }
      if (config?.useMBL !== false) {
        useMBL = true;
      }
      if (config?.useHBL !== false) {
        useHBL = true;
      }
      if (config?.useOperationId !== false) {
        useOperationId = true;
      }
      if (config?.searchInAttachments === false) {
        searchInAttachments = false;
      }

      if (config?.subjectPatterns && Array.isArray(config.subjectPatterns)) {
        const searchIn = config.searchIn || ['subject', 'body'];
        
        for (const pattern of config.subjectPatterns) {
          if (pattern && typeof pattern === 'string' && pattern.trim()) {
            let processedPattern = pattern;
            
            if (pattern.includes('{operationId}') && operation.id) {
              processedPattern = processedPattern.replace(/\{operationId\}/g, operation.id);
            }
            if (pattern.includes('{projectName}') && operation.projectName) {
              processedPattern = processedPattern.replace(/\{projectName\}/g, operation.projectName);
            }
            if (pattern.includes('{bookingTracking}') && operation.bookingTracking) {
              processedPattern = processedPattern.replace(/\{bookingTracking\}/g, operation.bookingTracking);
            }
            if (pattern.includes('{mbl_awb}') && operation.mbl_awb) {
              processedPattern = processedPattern.replace(/\{mbl_awb\}/g, operation.mbl_awb);
            }
            if (pattern.includes('{hbl_awb}') && operation.hbl_awb) {
              processedPattern = processedPattern.replace(/\{hbl_awb\}/g, operation.hbl_awb);
            }
            
            const patternConditions = [];
            if (searchIn.includes('subject')) {
              patternConditions.push({ subject: { contains: processedPattern, mode: 'insensitive' as any } });
            }
            if (searchIn.includes('body')) {
              patternConditions.push({ body: { contains: processedPattern, mode: 'insensitive' as any } });
            }
            
            if (patternConditions.length > 0) {
              searchConditions.push({ OR: patternConditions });
            }
          }
        }
      }
    }

    if (useClientEmail && operation.clients?.email) {
      const clientEmail = operation.clients.email.toLowerCase();
      searchConditions.push({
        OR: [
          { from: { contains: clientEmail, mode: 'insensitive' as any } },
          { 
            to: { 
              path: ['$'],
              array_contains: { email: clientEmail }
            } 
          },
        ],
      });
    }

    if (useOperationId && operation.id) {
      searchConditions.push({
        OR: [
          { subject: { contains: operation.id, mode: 'insensitive' as any } },
          { body: { contains: operation.id, mode: 'insensitive' as any } },
        ],
      });
    }

    if (useBookingTracking && operation.bookingTracking) {
      searchConditions.push({
        OR: [
          { subject: { contains: operation.bookingTracking, mode: 'insensitive' as any } },
          { body: { contains: operation.bookingTracking, mode: 'insensitive' as any } },
        ],
      });
    }

    if (useMBL && operation.mbl_awb) {
      searchConditions.push({
        OR: [
          { subject: { contains: operation.mbl_awb, mode: 'insensitive' as any } },
          { body: { contains: operation.mbl_awb, mode: 'insensitive' as any } },
        ],
      });
    }

    if (useHBL && operation.hbl_awb) {
      searchConditions.push({
        OR: [
          { subject: { contains: operation.hbl_awb, mode: 'insensitive' as any } },
          { body: { contains: operation.hbl_awb, mode: 'insensitive' as any } },
        ],
      });
    }

    if (searchConditions.length === 0) {
      return 0;
    }

    const matchingEmails = await this.prisma.email_messages.findMany({
      where: {
        accountId: { in: accountIds },
        OR: searchConditions,
        operationId: null,
      },
      select: {
        id: true,
      },
      take: 50,
    });

    let matchingEmailIds = new Set(matchingEmails.map(e => e.id));

    if (searchInAttachments) {
      const additionalMatches = await this.searchInEmailAttachments(operation, accountIds);
      additionalMatches.forEach(id => matchingEmailIds.add(id));
    }

    if (matchingEmailIds.size === 0) {
      return 0;
    }

    const emailIds = Array.from(matchingEmailIds);
    await this.prisma.email_messages.updateMany({
      where: {
        id: { in: emailIds },
      },
      data: {
        operationId: operation.id,
      },
    });

    return emailIds.length;
  }

  private async searchInEmailAttachments(operation: any, accountIds: string[]): Promise<string[]> {
    const searchPatterns = [];
    
    if (operation.id) searchPatterns.push(operation.id);
    if (operation.bookingTracking) searchPatterns.push(operation.bookingTracking);
    if (operation.mbl_awb) searchPatterns.push(operation.mbl_awb);
    if (operation.hbl_awb) searchPatterns.push(operation.hbl_awb);
    if (operation.projectName) searchPatterns.push(operation.projectName);
    
    if (searchPatterns.length === 0) {
      return [];
    }

    const emailsWithAttachments = await this.prisma.email_messages.findMany({
      where: {
        accountId: { in: accountIds },
        operationId: null,
        hasAttachments: true,
        attachmentsData: { not: null },
      },
      select: {
        id: true,
        attachmentsData: true,
      },
      take: 100,
    });

    if (emailsWithAttachments.length === 0) {
      return [];
    }

    const matchedEmailIds: string[] = [];

    for (const email of emailsWithAttachments) {
      try {
        const attachments = email.attachmentsData as any[];
        if (!attachments || attachments.length === 0) continue;

        for (const attachment of attachments) {
          const extractedText = await this.documentProcessor.processAttachment(attachment);
          
          if (extractedText) {
            const textLower = extractedText.toLowerCase();
            const foundMatch = searchPatterns.some(pattern => 
              textLower.includes(pattern.toLowerCase())
            );

            if (foundMatch) {
              this.logger.log(`📎 Encontrada referencia en adjunto de email ${email.id}: ${attachment.filename}`);
              matchedEmailIds.push(email.id);
              break;
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error procesando adjuntos del email ${email.id}:`, error.message);
      }
    }

    return matchedEmailIds;
  }
}
