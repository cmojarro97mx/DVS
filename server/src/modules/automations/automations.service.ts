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
    const emailAccounts = await this.prisma.emailAccount.findMany({
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
    const operations = await this.prisma.operation.findMany({
      where: {
        organizationId,
        status: { notIn: ['cancelled', 'completed'] },
      },
      include: {
        client: {
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

    // Construir condiciones de búsqueda basadas en las automaciones
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

      // Procesar patrones personalizados
      if (config?.subjectPatterns && Array.isArray(config.subjectPatterns)) {
        const searchIn = config.searchIn || ['subject', 'body'];
        
        for (const pattern of config.subjectPatterns) {
          if (pattern && typeof pattern === 'string' && pattern.trim()) {
            let processedPattern = pattern;
            
            // Reemplazar variables
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
            
            // Agregar condiciones de búsqueda
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

    // Agregar condiciones estándar
    if (useClientEmail && operation.client?.email) {
      const clientEmail = operation.client.email.toLowerCase();
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

    // Buscar emails que coincidan y que NO estén ya vinculados a esta operación
    const matchingEmails = await this.prisma.emailMessage.findMany({
      where: {
        accountId: { in: accountIds },
        OR: searchConditions,
        operationId: null, // Solo emails sin vincular
      },
      select: {
        id: true,
      },
      take: 50, // Limitar para no procesar demasiados de una vez
    });

    if (matchingEmails.length === 0) {
      return 0;
    }

    // Vincular emails a la operación
    const emailIds = matchingEmails.map(e => e.id);
    await this.prisma.emailMessage.updateMany({
      where: {
        id: { in: emailIds },
      },
      data: {
        operationId: operation.id,
      },
    });

    return emailIds.length;
  }
}
