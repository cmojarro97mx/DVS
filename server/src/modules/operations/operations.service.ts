import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OperationsService {
  constructor(
    private prisma: PrismaService,
    private backblazeService: BackblazeService,
    private notificationsService: NotificationsService,
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
    let useClientEmail = false;
    let useBookingTracking = false;
    let useMBL = false;
    let useHBL = false;

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

      if (config?.subjectPatterns && Array.isArray(config.subjectPatterns)) {
        for (const pattern of config.subjectPatterns) {
          if (pattern && typeof pattern === 'string' && pattern.trim()) {
            const patternWithOperationId = pattern
              .replace('{operationId}', operation.id)
              .replace('{projectName}', operation.projectName || '');
            
            searchConditions.push({
              subject: { contains: patternWithOperationId, mode: 'insensitive' as any },
            });
          }
        }
      }
    }

    if (useClientEmail && operation.client?.email) {
      searchConditions.push({
        AND: [
          {
            OR: [
              { from: { contains: operation.client.email, mode: 'insensitive' as any } },
              { to: { contains: operation.client.email, mode: 'insensitive' as any } },
            ],
          },
        ],
      });
    }

    if (useBookingTracking && operation.bookingTracking) {
      searchConditions.push({
        subject: { contains: operation.bookingTracking, mode: 'insensitive' as any },
      });
    }

    if (useMBL && operation.mbl_awb) {
      searchConditions.push({
        subject: { contains: operation.mbl_awb, mode: 'insensitive' as any },
      });
    }

    if (useHBL && operation.hbl_awb) {
      searchConditions.push({
        subject: { contains: operation.hbl_awb, mode: 'insensitive' as any },
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
        subject: true,
        snippet: true,
        date: true,
        unread: true,
        starred: true,
        isReplied: true,
        hasAttachments: true,
        folder: true,
      },
    });

    return emails;
  }
}
