import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DocumentProcessorService } from '../email-sync/document-processor.service';
import { EmailStorageService } from '../email-storage/email-storage.service';
import { randomUUID } from 'crypto';

@Injectable()
export class OperationsService {
  constructor(
    private prisma: PrismaService,
    private backblazeService: BackblazeService,
    private notificationsService: NotificationsService,
    private documentProcessor: DocumentProcessorService,
    private emailStorageService: EmailStorageService,
  ) {}

  async findAll(organizationId: string) {
    const operations = await this.prisma.operations.findMany({
      where: { organizationId },
      include: {
        clients: true,
        operation_assignees: {
          include: {
            users: {
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

    // Transform operation_assignees to assignees array of employee IDs for each operation
    return Promise.all(
      operations.map(async (operation) => {
        const assignees = [];
        console.log(`🔍 [FIND_ALL] Processing operation ${operation.id}, has ${operation.operation_assignees.length} assignees`);
        
        for (const assignee of operation.operation_assignees) {
          // Find employee by userId
          const employee = await this.prisma.employees.findFirst({
            where: { userId: assignee.userId, organizationId },
            select: { id: true, name: true },
          });
          
          if (employee) {
            console.log(`  ✅ Found employee ${employee.name} (ID: ${employee.id}) for userId: ${assignee.userId}`);
            assignees.push(employee.id);
          } else {
            console.warn(`  ⚠️ No employee found for userId: ${assignee.userId} in operation ${operation.id}`);
          }
        }
        
        console.log(`  📊 Final assignees for operation ${operation.id}:`, assignees);
        
        return {
          ...operation,
          assignees,
        };
      })
    );
  }

  async findOne(id: string, organizationId: string) {
    const operation = await this.prisma.operations.findFirst({
      where: { id, organizationId },
      include: {
        clients: true,
        operation_assignees: {
          include: {
            users: {
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

    // Transform operation_assignees to assignees array of employee IDs
    const assignees = [];
    console.log('🔍 [FIND_ONE] operation_assignees:', operation.operation_assignees.length);
    for (const assignee of operation.operation_assignees) {
      console.log('  - Searching employee for userId:', assignee.userId);
      // Find employee by userId
      const employee = await this.prisma.employees.findFirst({
        where: { userId: assignee.userId, organizationId },
        select: { id: true, name: true },
      });
      console.log('  - Found employee:', employee);
      if (employee) {
        assignees.push(employee.id);
      }
    }

    console.log('✅ [FIND_ONE] Final assignees array:', assignees);

    return {
      ...operation,
      assignees,
    };
  }

  async create(data: any, organizationId: string, userId: string) {
    try {
      const { assignees, ...operationData } = data;

      console.log('🔍 [CREATE OPERATION] Received data:', {
        hasAssignees: !!assignees,
        assigneesArray: assignees,
        assigneesLength: assignees?.length || 0,
        organizationId,
        creatorUserId: userId
      });

      const cleanData = this.cleanOperationData(operationData);

      const operation = await this.prisma.operations.create({
        data: {
          ...cleanData,
          organizationId,
          createdById: userId,
        },
      });

      console.log('✅ Operation created with ID:', operation.id);

    if (assignees && assignees.length > 0) {
      console.log(`👥 Processing ${assignees.length} assignees for operation ${operation.id}`);
      
      for (const assigneeId of assignees) {
        console.log(`  - Checking assignee: ${assigneeId}`);
        
        const employee = await this.prisma.employees.findUnique({
          where: { id: assigneeId },
          select: { id: true, name: true, userId: true }
        });

        if (employee && employee.userId) {
          console.log(`  ✅ Employee ${employee.name} (${assigneeId}) found with user ID ${employee.userId}, creating assignment`);
          
          const assignment = await this.prisma.operation_assignees.create({
            data: {
              id: randomUUID(),
              operations: { connect: { id: operation.id } },
              users: { connect: { id: employee.userId } },
            },
          });
          
          console.log(`  ✅ Assignment created:`, assignment.id);

          await this.notificationsService.sendNotificationToUser(employee.userId, {
            title: 'Nueva operación asignada',
            body: `Se te ha asignado una nueva operación`,
            url: `/operations/${operation.id}`,
            data: { type: 'operation_assigned', operationId: operation.id },
          });
        } else if (employee && !employee.userId) {
          console.warn(`  ⚠️ Employee ${employee.name} (${assigneeId}) has no associated user account`);
        } else {
          console.warn(`  ❌ Employee with ID ${assigneeId} not found`);
        }
      }
      console.log(`✅ Finished processing assignees for operation ${operation.id}`);
    } else {
      console.log('ℹ️ No assignees provided for this operation');
    }

    return this.findOne(operation.id, organizationId);
    } catch (error) {
      console.error('❌ Error creating operation:', error);
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
    const existing = await this.prisma.operations.findFirst({
      where: { id, organizationId },
      include: {
        operation_assignees: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Operation with ID ${id} not found`);
    }

    const { assignees, ...operationData } = data;
    const cleanData = this.cleanOperationData(operationData);

    const operation = await this.prisma.operations.update({
      where: { id },
      data: cleanData,
    });

    if (assignees !== undefined) {
      console.log(`🔄 [UPDATE ASSIGNEES] Processing ${assignees.length} assignees for operation ${id}`);
      
      const oldAssigneeIds = existing.operation_assignees.map(a => a.userId);
      
      // Delete all existing assignments
      await this.prisma.operation_assignees.deleteMany({
        where: { operationId: id },
      });

      if (assignees.length > 0) {
        const newUserIds = [];
        
        // Process each assignee (expecting employee IDs)
        for (const assigneeId of assignees) {
          console.log(`  - Processing assignee: ${assigneeId}`);
          
          // Look up employee to get their userId
          const employee = await this.prisma.employees.findUnique({
            where: { id: assigneeId },
            select: { id: true, name: true, userId: true }
          });

          if (employee && employee.userId) {
            console.log(`  ✅ Employee ${employee.name} found with user ID ${employee.userId}, creating assignment`);
            
            await this.prisma.operation_assignees.create({
              data: {
                id: randomUUID(),
                operations: { connect: { id: id } },
                users: { connect: { id: employee.userId } },
              },
            });
            
            newUserIds.push(employee.userId);
          } else if (employee && !employee.userId) {
            console.warn(`  ⚠️ Employee ${employee.name} (${assigneeId}) has no associated user account`);
          } else {
            console.warn(`  ❌ Employee with ID ${assigneeId} not found`);
          }
        }

        // Send notifications to newly added assignees
        const addedAssignees = newUserIds.filter(userId => !oldAssigneeIds.includes(userId));
        for (const userId of addedAssignees) {
          await this.notificationsService.sendNotificationToUser(userId, {
            title: 'Nueva operación asignada',
            body: `Se te ha asignado una nueva operación`,
            url: `/operations/${operation.id}`,
            data: { type: 'operation_assigned', operationId: operation.id },
          });
        }
        
        console.log(`✅ Finished processing ${newUserIds.length} assignees for operation ${id}`);
      } else {
        console.log('ℹ️ No assignees provided, all assignments removed');
      }

      // Send update notification to all assignees if operation data changed
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
    const existing = await this.prisma.operations.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Operation with ID ${id} not found`);
    }

    await this.prisma.operations.delete({
      where: { id },
    });

    return { success: true };
  }

  async uploadDocument(
    operationId: string,
    file: Express.Multer.File,
    organizationId: string,
  ) {
    const operation = await this.prisma.operations.findFirst({
      where: { id: operationId, organizationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    const folder = `operations/${operationId}`;
    const { url, key } = await this.backblazeService.uploadFile(file, folder);

    const document = await this.prisma.documents.create({
      data: {
        id: randomUUID(),
        updatedAt: new Date(),
        name: file.originalname,
        type: 'file',
        url,
        size: file.size,
        mimeType: file.mimetype,
        operations: { connect: { id: operationId } },
      },
    });

    return document;
  }

  async getDocuments(operationId: string, organizationId: string) {
    const operation = await this.prisma.operations.findFirst({
      where: { id: operationId, organizationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    return this.prisma.documents.findMany({
      where: { operationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDocument(
    documentId: string,
    operationId: string,
    organizationId: string,
  ) {
    const operation = await this.prisma.operations.findFirst({
      where: { id: operationId, organizationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    const document = await this.prisma.documents.findFirst({
      where: { id: documentId, operationId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    await this.prisma.documents.delete({
      where: { id: documentId },
    });

    return { success: true };
  }

  async updateCommissionHistory(
    operationId: string,
    commissionHistory: any,
    organizationId: string,
  ) {
    const operation = await this.prisma.operations.findFirst({
      where: { id: operationId, organizationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    return this.prisma.operations.update({
      where: { id: operationId },
      data: { commissionHistory },
    });
  }

  async getRelatedEmails(
    operationId: string,
    organizationId: string,
    userId: string,
  ) {
    const operation = await this.prisma.operations.findFirst({
      where: { id: operationId, organizationId },
      include: {
        clients: true,
        operation_assignees: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    const emailAccounts = await this.prisma.email_accounts.findMany({
      where: {
        users: {
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

    const automations = await this.prisma.automations.findMany({
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
      return [];
    }

    const emails = await this.prisma.email_messages.findMany({
      where: {
        accountId: { in: accountIds },
        OR: searchConditions,
      },
      orderBy: { date: 'desc' },
      take: 100,
      select: {
        id: true,
        accountId: true,
        gmailMessageId: true,
        from: true,
        fromName: true,
        to: true,
        cc: true,
        subject: true,
        snippet: true,
        body: true,
        htmlBodyUrl: true,
        htmlBodyKey: true,
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
    const emailsWithAttachments = await this.prisma.email_messages.findMany({
      where: {
        accountId: { in: accountIds },
        hasAttachments: true,
        id: { notIn: Array.from(additionalEmailIds) }, // Excluir emails ya encontrados
      },
      orderBy: { date: 'desc' },
      take: 200, // Limitar para no procesar demasiados
      select: {
        id: true,
        accountId: true,
        gmailMessageId: true,
        from: true,
        fromName: true,
        to: true,
        cc: true,
        subject: true,
        snippet: true,
        body: true,
        htmlBodyUrl: true,
        htmlBodyKey: true,
        date: true,
        unread: true,
        starred: true,
        isReplied: true,
        hasAttachments: true,
        folder: true,
        attachmentsData: true,
      },
    });

    // Buscar patrones en el texto ya extraído de los adjuntos
    for (const email of emailsWithAttachments) {
      const attachments = email.attachmentsData as any;
      if (!attachments || !Array.isArray(attachments)) continue;

      try {
        // Buscar en el texto ya extraído (no procesar OCR en tiempo real)
        let found = false;
        for (const attachment of attachments) {
          if (!attachment.extractedText) continue;
          
          const extractedText = attachment.extractedText.toLowerCase();
          
          // Verificar si algún patrón coincide
          for (const pattern of attachmentPatterns) {
            if (extractedText.includes(pattern.toLowerCase())) {
              additionalEmailIds.add(email.id);
              emails.push({
                ...email,
                body: '',
                htmlBodyUrl: '',
                cc: null,
              });
              found = true;
              break;
            }
          }
          
          if (found) break;
        }
      } catch (error) {
        console.error(`Error searching attachments for email ${email.id}:`, error);
      }
    }

    // Generar URLs firmadas para los adjuntos y cuerpo HTML de todos los correos
    const emailsWithSignedUrls = await Promise.all(
      emails.map(async (email) => {
        const emailWithUrls: any = { ...email };

        // Generar URL firmada para el cuerpo HTML si está en B2
        if (email.htmlBodyKey) {
          try {
            emailWithUrls.htmlBodyUrl = await this.emailStorageService.getSignedUrl(email.htmlBodyKey);
          } catch (error) {
            console.error(`Error generating signed URL for HTML body ${email.htmlBodyKey}:`, error);
          }
        }

        // Generar URLs firmadas para los adjuntos
        if (email.attachmentsData && Array.isArray(email.attachmentsData) && email.attachmentsData.length > 0) {
          const attachmentsWithUrls = await Promise.all(
            email.attachmentsData.map(async (att: any) => {
              if (att.key) {
                try {
                  const url = await this.emailStorageService.getSignedUrl(att.key);
                  return {
                    ...att,
                    url,
                    b2Key: att.key,
                  };
                } catch (error) {
                  console.error(`Error generating signed URL for attachment ${att.key}:`, error);
                  return att;
                }
              }
              return att;
            })
          );
          emailWithUrls.attachmentsData = attachmentsWithUrls;
        }

        return emailWithUrls;
      })
    );

    return emailsWithSignedUrls;
  }

  async getEmailLinkingCriteria(operationId: string, organizationId: string) {
    const operation = await this.prisma.operations.findFirst({
      where: { id: operationId, organizationId },
      include: {
        clients: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }

    const automations = await this.prisma.automations.findMany({
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
      clientEmail: operation.clients?.email || null,
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
