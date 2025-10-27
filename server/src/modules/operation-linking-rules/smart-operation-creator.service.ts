import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { OperationLinkingRulesService } from './operation-linking-rules.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
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
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async processEmailForOperationCreation(
    emailMessage: any,
    organizationId: string,
  ) {
    try {
      const rules = await this.linkingRulesService.getEnabledRules(organizationId);

      if (rules.length === 0) {
        this.logger.debug('No enabled linking rules found');
        return null;
      }

      const subject = emailMessage.subject || '';

      for (const rule of rules) {
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
    );

    const clientId = await this.findOrCreateClient(
      extractedData.clientName,
      extractedData.clientEmail,
      organizationId,
      rule.autoCreateClients,
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

    await this.sendCreationNotification(operation, organizationId, needsAttention);

    return operation;
  }

  private async extractOperationDataWithAI(emailMessage: any, operationName: string) {
    if (!this.genAI) {
      this.logger.warn('Gemini AI not configured, using basic extraction');
      return this.basicExtraction(emailMessage, operationName);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const emailBody = this.stripHtml(emailMessage.bodyText || emailMessage.snippet || '').substring(0, 2000);
      const subject = emailMessage.subject || '';

      const prompt = `Analiza el siguiente correo electrónico y extrae información para crear una operación logística.

Asunto: ${subject}
Cuerpo: ${emailBody}

Extrae la siguiente información en formato JSON (si no encuentras algún dato, usa null):
{
  "clientName": "nombre del cliente o empresa",
  "clientEmail": "email del cliente",
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
        this.logger.log('✅ AI extraction successful');
        return extracted;
      }

      throw new Error('No valid JSON found in AI response');
    } catch (error) {
      this.logger.warn('AI extraction failed, using basic extraction:', error.message);
      return this.basicExtraction(emailMessage, operationName);
    }
  }

  private basicExtraction(emailMessage: any, operationName: string) {
    const body = this.stripHtml(emailMessage.bodyText || emailMessage.snippet || '');
    const from = emailMessage.from || '';

    const emailMatch = from.match(/<([^>]+)>/);
    const clientEmail = emailMatch ? emailMatch[1] : from;

    const nameMatch = from.match(/^([^<]+)</);
    const clientName = nameMatch ? nameMatch[1].trim() : 'Cliente Desconocido';

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
  ): Promise<string | null> {
    if (!clientName && !clientEmail) {
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
}
