import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';

@Injectable()
export class OperationsService {
  constructor(
    private prisma: PrismaService,
    private backblazeService: BackblazeService,
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
        } else {
          console.warn(`User with ID ${userId} not found, skipping assignment`);
        }
      }
    }

    return this.findOne(operation.id, organizationId);
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
}
