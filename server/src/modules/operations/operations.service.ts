import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DocumentProcessorService } from '../email-sync/document-processor.service';

@Injectable()
export class OperationsService {
  constructor(
    private prisma: PrismaService,
    private backblazeService: BackblazeService,
    private notificationsService: NotificationsService,
    private documentProcessor: DocumentProcessorService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.operation.findMany({
      where: { organizationId },
      include: {
        client: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const operation = await this.prisma.operation.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${id} not found`);
    }

    return operation;
  }

  async create(data: any, organizationId: string, userId: string) {
    try {
      const { assignees, ...operationData } = data;

      const cleanData = this.cleanOperationData(operationData);

      const operation = await this.prisma.operation.create({
        data: {
          ...cleanData,
          organizationId,
          createdById: userId,
        },
      });

    if (assignees && assignees.length > 0) {
      for (const userId of assignees) {
        const userExists = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (userExists) {
          await this.prisma.operationAssignee.create({
            data: {
              operationId: operation.id,
              userId: userId,
            },
          });

          await this.notificationsService.sendNotificationToUser(userId, {
            title: 'Nueva operación asignada',
            body: `Se te ha asignado una nueva operación`,
            url: `/operations/${operation.id}`,
            data: { type: 'operation_assigned', operationId: operation.id },
          });
        } else {
          console.warn(`User with ID ${userId} not found, skipping assignment`);
        }
      }
    }

    return this.findOne(operation.id, organizationId);
    } catch (error) {
      console.error('Error creating operation:', error);
      throw error;
    }
  }

  private cleanOperationData(data: any) {
    const cleanedData: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === null || value === undefined) {
        continue;
      }
      
      const dateFields = ['startDate', 'deadline', 'etd', 'eta', 'pickupDate'];
      if (dateFields.includes(key) && typeof value === 'string') {
        cleanedData[key] = new Date(value);
      } else {
        cleanedData[key] = value;
      }
    }
    
    return cleanedData;
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await this.prisma.operation.findFirst({
      where: { id, organizationId },
      include: {
        assignees: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Operation with ID ${id} not found`);
    }

    const { assignees, ...operationData } = data;
    const cleanData = this.cleanOperationData(operationData);

    const operation = await this.prisma.operation.update({
      where: { id },
      data: cleanData,
    });

    if (assignees !== undefined) {
      const oldAssigneeIds = existing.assignees.map(a => a.userId);
      const newAssigneeIds = assignees;
      
      await this.prisma.operationAssignee.deleteMany({
        where: { operationId: id },
      });

      if (assignees.length > 0) {
        await Promise.all(
          assignees.map((assigneeName: string) =>
            this.prisma.operationAssignee.create({
              data: {
                operationId: id,
                userId: assigneeName,
              },
            }),
          ),
        );

        const addedAssignees = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));
        for (const userId of addedAssignees) {
          await this.notificationsService.sendNotificationToUser(userId, {
            title: 'Nueva operación asignada',
            body: `Se te ha asignado una nueva operación`,
            url: `/operations/${operation.id}`,
            data: { type: 'operation_assigned', operationId: operation.id },
          });
        }
      }

      const allAssigneeIds = assignees.length > 0 ? assignees : oldAssigneeIds;
      if (allAssigneeIds.length > 0 && Object.keys(cleanData).length > 0) {
        await this.notificationsService.sendNotificationToUsers(allAssigneeIds, {
          title: 'Operación actualizada',
          body: `Una de tus operaciones ha sido actualizada`,
          url: `/operations/${operation.id}`,
          data: { type: 'operation_updated', operationId: operation.id },
        });
      }
    }

    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.operation.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Operation with ID ${id} not found`);
    }

    await this.prisma.operation.delete({
      where: { id },
    });

    return { success: true };
  }

  async uploadDocument(
    operationId: string,
    file: Express.Multer.File,
    organizationId: string,
  ) {
    const operation = await this.prisma.operation.findFirst({
      where: { id: operationId, organizationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    const folder = `operations/${operationId}`;
    const { url, key } = await this.backblazeService.uploadFile(file, folder);

    const document = await this.prisma.document.create({
      data: {
        name: file.originalname,
        type: 'file',
        url,
        size: file.size,
        mimeType: file.mimetype,
        operationId,
      },
    });

    return document;
  }

  async getDocuments(operationId: string, organizationId: string) {
    const operation = await this.prisma.operation.findFirst({
      where: { id: operationId, organizationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    return this.prisma.document.findMany({
      where: { operationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDocument(
    documentId: string,
    operationId: string,
    organizationId: string,
  ) {
    const operation = await this.prisma.operation.findFirst({
      where: { id: operationId, organizationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, operationId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    await this.prisma.document.delete({
      where: { id: documentId },
    });

    return { success: true };
  }

  async updateCommissionHistory(
    operationId: string,
    commissionHistory: any,
    organizationId: string,
  ) {
    const operation = await this.prisma.operation.findFirst({
      where: { id: operationId, organizationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    return this.prisma.operation.update({
      where: { id: operationId },
      data: { commissionHistory },
    });
  }

  async getRelatedEmails(
    operationId: string,
    organizationId: string,
    userId: string,
  ) {
    const operation = await this.prisma.operation.findFirst({
      where: { id: operationId, organizationId },
      include: {
        client: true,
        assignees: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    const emailAccounts = await this.prisma.emailAccount.findMany({
      where: {
        user: {
          organizationId,
        },
      },
      select: {
        id: true,
      },
    });

    const accountIds = emailAccounts.map(acc => acc.id);

    if (accountIds.length === 0) {
      return [];
    }

    const automations = await this.prisma.automation.findMany({
      where: {
        organizationId,
        type: 'email_to_operation',
        enabled: true,
      },
    });

    const searchConditions = [];
    let useClientEmail = true;
    let useBookingTracking = true;
    let useMBL = true;
    let useHBL = true;
    let useOperationId = true;

    if (automations.length > 0) {
      useClientEmail = false;
      useBookingTracking = false;
      useMBL = false;
      useHBL = false;
      useOperationId = false;

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

        if (config?.subjectPatterns && Array.isArray(config.subjectPatterns)) {
          for (const pattern of config.subjectPatterns) {
            if (pattern && typeof pattern === 'string' && pattern.trim()) {
              let processedPattern = pattern;
              
              if (pattern.includes('{operationId}') && operation.id) {
                processedPattern = processedPattern.replace('{operationId}', operation.id);
              }
              if (pattern.includes('{projectName}') && operation.projectName) {
                processedPattern = processedPattern.replace('{projectName}', operation.projectName);
              }
              if (pattern.includes('{bookingTracking}') && operation.bookingTracking) {
                processedPattern = processedPattern.replace('{bookingTracking}', operation.bookingTracking);
              }
              if (pattern.includes('{mbl_awb}') && operation.mbl_awb) {
                processedPattern = processedPattern.replace('{mbl_awb}', operation.mbl_awb);
              }
              if (pattern.includes('{hbl_awb}') && operation.hbl_awb) {
                processedPattern = processedPattern.replace('{hbl_awb}', operation.hbl_awb);
              }
              
              const searchLocations = config.searchIn || ['subject', 'body'];
              const locationConditions = [];
              
              if (searchLocations.includes('subject')) {
                locationConditions.push({
                  subject: { contains: processedPattern, mode: 'insensitive' as any }
                });
              }
              
              if (searchLocations.includes('body')) {
                locationConditions.push({
                  body: { contains: processedPattern, mode: 'insensitive' as any }
                });
              }
              
              // Nota: La búsqueda en attachments se realiza después en una segunda pasada
              // porque Prisma no puede buscar directamente dentro de JSON
              
              if (locationConditions.length > 0) {
                searchConditions.push({
                  OR: locationConditions
                });
              }
            }
          }
        }
      }
    }

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
      return [];
    }

    const emails = await this.prisma.emailMessage.findMany({
      where: {
        accountId: { in: accountIds },
        OR: searchConditions,
      },
      orderBy: { date: 'desc' },
      take: 100,
      select: {
        id: true,
        from: true,
        fromName: true,
        to: true,
        cc: true,
        subject: true,
        snippet: true,
        body: true,
        htmlBodyUrl: true,
        date: true,
        unread: true,
        starred: true,
        isReplied: true,
        hasAttachments: true,
        folder: true,
        attachmentsData: true,
      },
    });

    // Verificar si necesitamos buscar en archivos adjuntos
    const needsAttachmentSearch = automations.some(auto => {
      const config = auto.conditions as any;
      return config?.searchIn?.includes('attachments');
    });

    if (!needsAttachmentSearch) {
      return emails;
    }

    // Recopilar todos los patrones que deben buscarse en adjuntos
    const attachmentPatterns: string[] = [];
    
    for (const automation of automations) {
      const config = automation.conditions as any;
      if (config?.searchIn?.includes('attachments') && config?.subjectPatterns) {
        for (const pattern of config.subjectPatterns) {
          if (pattern && typeof pattern === 'string' && pattern.trim()) {
            let processedPattern = pattern;
            
            if (pattern.includes('{operationId}') && operation.id) {
              processedPattern = processedPattern.replace('{operationId}', operation.id);
            }
            if (pattern.includes('{projectName}') && operation.projectName) {
              processedPattern = processedPattern.replace('{projectName}', operation.projectName);
            }
            if (pattern.includes('{bookingTracking}') && operation.bookingTracking) {
              processedPattern = processedPattern.replace('{bookingTracking}', operation.bookingTracking);
            }
            if (pattern.includes('{mbl_awb}') && operation.mbl_awb) {
              processedPattern = processedPattern.replace('{mbl_awb}', operation.mbl_awb);
            }
            if (pattern.includes('{hbl_awb}') && operation.hbl_awb) {
              processedPattern = processedPattern.replace('{hbl_awb}', operation.hbl_awb);
            }
            
            attachmentPatterns.push(processedPattern);
          }
        }
      }
    }

    // Filtrar emails adicionales que coincidan en sus archivos adjuntos
    const additionalEmailIds = new Set<string>(emails.map(e => e.id));
    
    // Buscar en emails con adjuntos
    const emailsWithAttachments = await this.prisma.emailMessage.findMany({
      where: {
        accountId: { in: accountIds },
        hasAttachments: true,
        id: { notIn: Array.from(additionalEmailIds) }, // Excluir emails ya encontrados
      },
      orderBy: { date: 'desc' },
      take: 200, // Limitar para no procesar demasiados
      select: {
        id: true,
        from: true,
        fromName: true,
        to: true,
        subject: true,
        snippet: true,
        date: true,
        unread: true,
        starred: true,
        isReplied: true,
        hasAttachments: true,
        folder: true,
        attachmentsData: true,
      },
    });

    // Procesar archivos adjuntos y buscar patrones
    for (const email of emailsWithAttachments) {
      const attachments = email.attachmentsData as any;
      if (!attachments || !Array.isArray(attachments)) continue;

      try {
        // Procesar adjuntos y extraer texto
        const extractedTexts = await this.documentProcessor.processEmailAttachments(attachments);
        
        // Verificar si algún patrón coincide
        for (const pattern of attachmentPatterns) {
          if (this.documentProcessor.searchInExtractedTexts(extractedTexts, pattern)) {
            additionalEmailIds.add(email.id);
            emails.push(email);
            break; // Ya encontramos una coincidencia, no seguir buscando
          }
        }
      } catch (error) {
        // Silenciosamente fallar el procesamiento de este email
        console.error(`Error processing attachments for email ${email.id}:`, error);
      }
    }

    return emails;
  }

  async getEmailLinkingCriteria(operationId: string, organizationId: string) {
    const operation = await this.prisma.operation.findFirst({
      where: { id: operationId, organizationId },
      include: {
        client: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    const automations = await this.prisma.automation.findMany({
      where: {
        organizationId,
        type: 'email_to_operation',
        enabled: true,
      },
    });

    const criteria = {
      customPatterns: [],
      useClientEmail: false,
      useOperationId: false,
      useBookingTracking: false,
      useMBL: false,
      useHBL: false,
      clientEmail: operation.client?.email || null,
      operationId: operation.id,
      bookingTracking: operation.bookingTracking || null,
      mbl_awb: operation.mbl_awb || null,
      hbl_awb: operation.hbl_awb || null,
    };

    if (automations.length > 0) {
      for (const automation of automations) {
        const config = automation.conditions as any;
        
        if (config?.useClientEmail !== false) {
          criteria.useClientEmail = true;
        }
        if (config?.useBookingTracking !== false) {
          criteria.useBookingTracking = true;
        }
        if (config?.useMBL !== false) {
          criteria.useMBL = true;
        }
        if (config?.useHBL !== false) {
          criteria.useHBL = true;
        }
        if (config?.useOperationId !== false) {
          criteria.useOperationId = true;
        }

        if (config?.subjectPatterns && Array.isArray(config.subjectPatterns)) {
          for (const pattern of config.subjectPatterns) {
            if (pattern && typeof pattern === 'string' && pattern.trim()) {
              criteria.customPatterns.push(pattern);
            }
          }
        }
      }
    } else {
      criteria.useClientEmail = true;
      criteria.useOperationId = true;
      criteria.useBookingTracking = true;
      criteria.useMBL = true;
      criteria.useHBL = true;
    }

    return criteria;
  }
}
