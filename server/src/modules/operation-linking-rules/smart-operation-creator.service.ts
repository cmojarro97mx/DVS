import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { OperationLinkingRulesService } from './operation-linking-rules.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { randomUUID } from 'crypto';

@Injectable()
export class SmartOperationCreatorService {
  private readonly logger = new Logger(SmartOperationCreatorService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private linkingRulesService: OperationLinkingRulesService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => KnowledgeBaseService))
    private knowledgeBase: KnowledgeBaseService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async processEmailForOperationCreation(
    emailMessage: any,
    organizationId: string,
    emailAccountId?: string,
  ) {
    try {
      const rules = await this.linkingRulesService.getEnabledRules(organizationId);

      if (rules.length === 0) {
        this.logger.debug('No enabled linking rules found');
        return null;
      }

      const subject = emailMessage.subject || '';
      const emailFrom = emailMessage.from || '';

      for (const rule of rules) {
        // Check if rule is configured for specific email accounts
        if (emailAccountId && rule.emailAccountIds && Array.isArray(rule.emailAccountIds)) {
          if (rule.emailAccountIds.length > 0 && !rule.emailAccountIds.includes(emailAccountId)) {
            this.logger.debug(
              `Email from account "${emailAccountId}" is not in configured accounts for rule "${rule.name}", skipping`,
            );
            continue;
          }
        }

        if (!this.isEmailFromCompanyDomain(emailFrom, rule.companyDomains)) {
          this.logger.debug(
            `Email from "${emailFrom}" is not from configured company domains, skipping rule "${rule.name}"`,
          );
          continue;
        }

        const match = this.matchSubjectPattern(subject, rule.subjectPattern);

        if (match) {
          this.logger.log(
            `📧 Email subject "${subject}" matched rule "${rule.name}" with pattern "${rule.subjectPattern}"`,
          );

          const operationName = match.operationName;

          const existingOperation = await this.findOperationByName(
            operationName,
            organizationId,
          );

          if (existingOperation) {
            this.logger.log(
              `✅ Operation "${operationName}" already exists, skipping creation`,
            );
            return existingOperation;
          }

          this.logger.log(
            `🆕 Operation "${operationName}" not found, creating automatically...`,
          );

          const newOperation = await this.createOperationFromEmail(
            emailMessage,
            operationName,
            rule,
            organizationId,
          );

          return newOperation;
        }
      }

      this.logger.debug('No matching rules found for email subject');
      return null;
    } catch (error) {
      this.logger.error('Error processing email for operation creation:', error);
      return null;
    }
  }

  private matchSubjectPattern(subject: string, pattern: string) {
    try {
      const regex = new RegExp(pattern, 'i');
      const match = subject.match(regex);

      if (match) {
        const operationName = match[1] || match[0];
        return { operationName, fullMatch: match[0] };
      }

      if (subject.includes(pattern)) {
        const parts = subject.split(pattern);
        if (parts.length > 1) {
          const operationName = parts[1].trim().split(' ')[0].trim();
          return { operationName, fullMatch: pattern + operationName };
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(`Invalid regex pattern: ${pattern}`, error);
      return null;
    }
  }

  private async findOperationByName(
    projectName: string,
    organizationId: string,
  ) {
    return this.prisma.operations.findFirst({
      where: {
        projectName: {
          contains: projectName,
          mode: 'insensitive',
        },
        organizationId,
      },
    });
  }

  private async createOperationFromEmail(
    emailMessage: any,
    operationName: string,
    rule: any,
    organizationId: string,
  ) {
    const extractedData = await this.extractOperationDataWithAI(
      emailMessage,
      operationName,
      rule.companyDomains,
      organizationId,
    );

    const clientId = await this.findOrCreateClient(
      extractedData.clientName,
      extractedData.clientEmail,
      organizationId,
      rule.autoCreateClients,
      rule.companyDomains,
    );

    const missingFields = this.identifyMissingFields(extractedData);
    const needsAttention = missingFields.length > 0;

    const operationData: any = {
      projectName: operationName,
      status: 'Planning',
      progress: 0,
      organizationId,
      needsAttention,
      autoCreated: true,
      missingFields: missingFields.length > 0 ? missingFields : null,
    };

    if (rule.autoFillFields) {
      if (extractedData.projectCategory) operationData.projectCategory = extractedData.projectCategory;
      if (extractedData.operationType) operationData.operationType = extractedData.operationType;
      if (extractedData.shippingMode) operationData.shippingMode = extractedData.shippingMode;
      if (extractedData.courrier) operationData.courrier = extractedData.courrier;
      if (extractedData.pickupAddress) operationData.pickupAddress = extractedData.pickupAddress;
      if (extractedData.deliveryAddress) operationData.deliveryAddress = extractedData.deliveryAddress;
      if (extractedData.bookingTracking) operationData.bookingTracking = extractedData.bookingTracking;
      if (extractedData.mbl_awb) operationData.mbl_awb = extractedData.mbl_awb;
      if (extractedData.hbl_awb) operationData.hbl_awb = extractedData.hbl_awb;
      if (extractedData.description) operationData.description = extractedData.description;
      if (extractedData.etd) operationData.etd = new Date(extractedData.etd);
      if (extractedData.eta) operationData.eta = new Date(extractedData.eta);
    }

    if (clientId) {
      operationData.clientId = clientId;
    }

    const operation = await this.prisma.operations.create({
      data: operationData,
    });

    this.logger.log(`✅ Operation "${operationName}" created successfully (ID: ${operation.id})`);

    if (rule.defaultAssignees && Array.isArray(rule.defaultAssignees) && rule.defaultAssignees.length > 0) {
      await this.assignDefaultEmployees(operation.id, rule.defaultAssignees, organizationId);
    }

    // 📚 Contribuir a la Knowledge Base con la información extraída
    await this.contributeToKnowledgeBase(
      organizationId,
      emailMessage,
      extractedData,
      operation,
    );

    await this.sendCreationNotification(operation, organizationId, needsAttention);

    return operation;
  }

  private async extractOperationDataWithAI(
    emailMessage: any, 
    operationName: string, 
    companyDomains?: any,
    organizationId?: string,
  ) {
    if (!this.genAI) {
      this.logger.warn('Gemini AI not configured, using basic extraction');
      return this.basicExtraction(emailMessage, operationName, companyDomains);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const emailBody = this.stripHtml(emailMessage.bodyText || emailMessage.snippet || '').substring(0, 2000);
      const subject = emailMessage.subject || '';
      
      const domainInstructions = companyDomains && Array.isArray(companyDomains) && companyDomains.length > 0
        ? `\n\nIMPORTANTE: NO extraigas como cliente emails que terminen en estos dominios (son empleados internos): ${companyDomains.join(', ')}`
        : '';

      // 🧠 Obtener conocimiento relevante de la Knowledge Base
      let knowledgeContext = '';
      if (organizationId) {
        try {
          const keywords = this.extractKeywordsFromText(emailBody + ' ' + subject);
          const relevantKnowledge = await this.knowledgeBase.getRelevantKnowledge(organizationId, {
            keywords,
            limit: 5,
          });

          if (relevantKnowledge && relevantKnowledge.length > 0) {
            knowledgeContext = '\n\n📚 CONTEXTO DE LA EMPRESA (usa esta información para mejorar precisión):\n';
            relevantKnowledge.forEach((entry: any) => {
              knowledgeContext += `- [${entry.category}] ${entry.title}: ${entry.content}\n`;
            });
            this.logger.log(`🧠 Knowledge Base: ${relevantKnowledge.length} entradas relevantes encontradas`);
          }
        } catch (error) {
          this.logger.warn('No se pudo obtener contexto de Knowledge Base:', error.message);
        }
      }

      const prompt = `Analiza el siguiente correo electrónico y extrae información para crear una operación logística.

Asunto: ${subject}
Cuerpo: ${emailBody}${domainInstructions}${knowledgeContext}

Extrae la siguiente información en formato JSON (si no encuentras algún dato, usa null):
{
  "clientName": "nombre del cliente o empresa",
  "clientEmail": "email del cliente (NO incluir emails internos de la empresa)",
  "projectCategory": "categoría del proyecto",
  "operationType": "tipo de operación (Import/Export/Domestic)",
  "shippingMode": "modo de envío (Air/Sea/Land)",
  "courrier": "nombre del courrier o transportista",
  "pickupAddress": "dirección de recogida",
  "deliveryAddress": "dirección de entrega",
  "bookingTracking": "número de booking o tracking",
  "mbl_awb": "Master Bill of Lading o Air Waybill",
  "hbl_awb": "House Bill of Lading",
  "description": "descripción breve de la operación",
  "etd": "fecha ETD en formato ISO si está disponible",
  "eta": "fecha ETA en formato ISO si está disponible"
}

Responde SOLO con el JSON, sin explicaciones adicionales.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        
        if (extracted.clientEmail && this.isCompanyDomainEmail(extracted.clientEmail, companyDomains)) {
          this.logger.log(`🚫 Removed company domain email from client: ${extracted.clientEmail}`);
          extracted.clientEmail = null;
        }
        
        this.logger.log('✅ AI extraction successful');
        return extracted;
      }

      throw new Error('No valid JSON found in AI response');
    } catch (error) {
      this.logger.warn('AI extraction failed, using basic extraction:', error.message);
      return this.basicExtraction(emailMessage, operationName, companyDomains);
    }
  }

  private extractKeywordsFromText(text: string): string[] {
    const stopWords = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'y', 'o', 'en', 'a', 'por', 'para',
      'con', 'sin', 'sobre', 'que', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    const unique = [...new Set(words)];
    return unique.slice(0, 10);
  }

  private basicExtraction(emailMessage: any, operationName: string, companyDomains?: any) {
    const body = this.stripHtml(emailMessage.bodyText || emailMessage.snippet || '');
    const from = emailMessage.from || '';

    const emailMatch = from.match(/<([^>]+)>/);
    let clientEmail = emailMatch ? emailMatch[1] : from;

    const nameMatch = from.match(/^([^<]+)</);
    let clientName = nameMatch ? nameMatch[1].trim() : 'Cliente Desconocido';

    if (this.isCompanyDomainEmail(clientEmail, companyDomains)) {
      this.logger.log(`🚫 Email "${clientEmail}" is from company domain, not using as client`);
      clientEmail = null;
      clientName = null;
    }

    return {
      clientName,
      clientEmail,
      projectCategory: null,
      operationType: null,
      shippingMode: null,
      courrier: null,
      pickupAddress: null,
      deliveryAddress: null,
      bookingTracking: operationName,
      mbl_awb: null,
      hbl_awb: null,
      description: `Operación creada automáticamente desde correo: ${emailMessage.subject}`,
      etd: null,
      eta: null,
    };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private async findOrCreateClient(
    clientName: string | null,
    clientEmail: string | null,
    organizationId: string,
    autoCreate: boolean,
    companyDomains?: any,
  ): Promise<string | null> {
    if (!clientName && !clientEmail) {
      return null;
    }

    if (clientEmail && this.isCompanyDomainEmail(clientEmail, companyDomains)) {
      this.logger.log(`🚫 Skipping client creation for company domain email: ${clientEmail}`);
      return null;
    }

    const searchCriteria: any = { organizationId };
    if (clientEmail) {
      searchCriteria.email = clientEmail;
    } else if (clientName) {
      searchCriteria.name = {
        contains: clientName,
        mode: 'insensitive',
      };
    }

    const existingClient = await this.prisma.clients.findFirst({
      where: searchCriteria,
    });

    if (existingClient) {
      this.logger.log(`✅ Client found: ${existingClient.name}`);
      return existingClient.id;
    }

    if (autoCreate && (clientName || clientEmail)) {
      const newClient = await this.prisma.clients.create({
        data: {
          name: clientName || clientEmail || 'Cliente Desconocido',
          email: clientEmail,
          organizationId,
          status: 'Active',
        },
      });

      this.logger.log(`🆕 Client created: ${newClient.name}`);
      return newClient.id;
    }

    return null;
  }

  private identifyMissingFields(extractedData: any): string[] {
    const importantFields = [
      'operationType',
      'shippingMode',
      'pickupAddress',
      'deliveryAddress',
    ];

    const missing = importantFields.filter(field => !extractedData[field]);
    return missing;
  }

  private async assignDefaultEmployees(
    operationId: string,
    employeeIds: string[],
    organizationId: string,
  ) {
    this.logger.log(`👥 Assigning ${employeeIds.length} default employees to operation ${operationId}`);

    for (const employeeId of employeeIds) {
      const employee = await this.prisma.employees.findUnique({
        where: { id: employeeId },
        select: { id: true, name: true, userId: true },
      });

      if (employee && employee.userId) {
        await this.prisma.operation_assignees.create({
          data: {
            id: randomUUID(),
            operations: { connect: { id: operationId } },
            users: { connect: { id: employee.userId } },
          },
        });

        this.logger.log(`  ✅ Assigned employee: ${employee.name}`);

        await this.notificationsService.sendNotificationToUser(employee.userId, {
          title: 'Nueva operación asignada automáticamente',
          body: `Se te ha asignado una nueva operación creada automáticamente`,
          url: `/operations/${operationId}`,
          data: { type: 'auto_operation_assigned', operationId },
        });
      }
    }
  }

  private async sendCreationNotification(
    operation: any,
    organizationId: string,
    needsAttention: boolean,
  ) {
    const admins = await this.prisma.users.findMany({
      where: { organizationId },
      take: 5,
    });

    for (const admin of admins) {
      await this.notificationsService.sendNotificationToUser(admin.id, {
        title: needsAttention
          ? '⚠️ Nueva operación creada - Requiere atención'
          : '✅ Nueva operación creada automáticamente',
        body: `Operación "${operation.projectName}" creada desde correo electrónico`,
        url: `/operations/${operation.id}`,
        data: {
          type: 'auto_operation_created',
          operationId: operation.id,
          needsAttention,
        },
      });
    }
  }

  private isEmailFromCompanyDomain(emailFrom: string, companyDomains?: any): boolean {
    if (!companyDomains || !Array.isArray(companyDomains) || companyDomains.length === 0) {
      return true;
    }

    const emailMatch = emailFrom.match(/<([^>]+)>/);
    const email = emailMatch ? emailMatch[1] : emailFrom;

    return companyDomains.some(domain => {
      const normalizedDomain = domain.startsWith('@') ? domain : '@' + domain;
      return email.toLowerCase().endsWith(normalizedDomain.toLowerCase());
    });
  }

  private isCompanyDomainEmail(email: string | null, companyDomains?: any): boolean {
    if (!email || !companyDomains || !Array.isArray(companyDomains) || companyDomains.length === 0) {
      return false;
    }

    return companyDomains.some(domain => {
      const normalizedDomain = domain.startsWith('@') ? domain : '@' + domain;
      return email.toLowerCase().endsWith(normalizedDomain.toLowerCase());
    });
  }

  private async contributeToKnowledgeBase(
    organizationId: string,
    emailMessage: any,
    extractedData: any,
    operation: any,
  ): Promise<void> {
    try {
      this.logger.log('📚 Contributing to Knowledge Base...');

      // Agregar cliente si fue identificado
      if (extractedData.clientName && extractedData.clientName !== 'Cliente Desconocido') {
        await this.knowledgeBase.addKnowledge(organizationId, null, {
          category: 'clients',
          title: `Cliente: ${extractedData.clientName}`,
          content: `${extractedData.clientName}${extractedData.clientEmail ? ` (${extractedData.clientEmail})` : ''}`,
          keywords: [extractedData.clientName.toLowerCase()],
          source: 'smart_operation_creator',
          sourceId: operation.id,
          metadata: { operationId: operation.id, emailId: emailMessage.id },
        });
      }

      // Agregar ruta si ambas direcciones fueron identificadas
      if (extractedData.pickupAddress && extractedData.deliveryAddress) {
        await this.knowledgeBase.addKnowledge(organizationId, null, {
          category: 'routes',
          title: `Ruta: ${extractedData.pickupAddress} → ${extractedData.deliveryAddress}`,
          content: `Origen: ${extractedData.pickupAddress}, Destino: ${extractedData.deliveryAddress}`,
          keywords: [
            extractedData.pickupAddress.toLowerCase().split(',')[0],
            extractedData.deliveryAddress.toLowerCase().split(',')[0],
          ],
          source: 'smart_operation_creator',
          sourceId: operation.id,
          metadata: { 
            operationId: operation.id,
            shippingMode: extractedData.shippingMode,
            operationType: extractedData.operationType,
          },
        });
      }

      // Agregar courier si fue identificado
      if (extractedData.courrier) {
        await this.knowledgeBase.addKnowledge(organizationId, null, {
          category: 'carriers',
          title: `Courier: ${extractedData.courrier}`,
          content: extractedData.courrier,
          keywords: [extractedData.courrier.toLowerCase()],
          source: 'smart_operation_creator',
          sourceId: operation.id,
          metadata: { operationId: operation.id, shippingMode: extractedData.shippingMode },
        });
      }

      // Agregar números de tracking/booking
      if (extractedData.bookingTracking && extractedData.bookingTracking !== operation.projectName) {
        await this.knowledgeBase.addKnowledge(organizationId, null, {
          category: 'tracking_numbers',
          title: `Tracking/Booking: ${extractedData.bookingTracking}`,
          content: extractedData.bookingTracking,
          keywords: [extractedData.bookingTracking.toLowerCase()],
          source: 'smart_operation_creator',
          sourceId: operation.id,
          metadata: { operationId: operation.id },
        });
      }

      // Agregar MBL/AWB si fue identificado
      if (extractedData.mbl_awb) {
        await this.knowledgeBase.addKnowledge(organizationId, null, {
          category: 'tracking_numbers',
          title: `MBL/AWB: ${extractedData.mbl_awb}`,
          content: extractedData.mbl_awb,
          keywords: [extractedData.mbl_awb.toLowerCase()],
          source: 'smart_operation_creator',
          sourceId: operation.id,
          metadata: { operationId: operation.id, type: 'mbl_awb' },
        });
      }

      this.logger.log('✅ Knowledge Base contribution completed');
    } catch (error) {
      this.logger.warn('Error contributing to Knowledge Base:', error.message);
    }
  }
}
