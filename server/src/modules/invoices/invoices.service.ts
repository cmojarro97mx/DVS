import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.invoice.findMany({
      where: { organizationId },
      include: {
        client: true,
        operation: true,
        bankAccount: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        operation: true,
        bankAccount: true,
        payments: true,
      },
    });
    
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    
    return invoice;
  }

  async create(data: any, organizationId: string) {
    await this.validateRelatedEntities(data, organizationId);
    
    const invoice = await this.prisma.invoice.create({
      data: {
        ...data,
        organizationId,
      },
      include: {
        client: true,
        operation: true,
        bankAccount: true,
      },
    });

    const admins = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ['admin', 'owner'] },
      },
      select: { id: true },
    });

    if (admins.length > 0) {
      await this.notificationsService.sendNotificationToUsers(
        admins.map(a => a.id),
        {
          title: 'Nueva factura creada',
          body: `Se ha creado una nueva factura ${invoice.number ? `#${invoice.number}` : ''} por ${invoice.amount} ${invoice.currency}`,
          url: `/invoices/${invoice.id}`,
          data: { type: 'invoice_created', invoiceId: invoice.id },
        },
      );
    }

    return invoice;
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await this.findOne(id, organizationId);
    
    await this.validateRelatedEntities(data, organizationId);
    
    const { organizationId: _, ...updateData } = data;
    
    return this.prisma.invoice.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        client: true,
        operation: true,
        bankAccount: true,
        payments: true,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.findOne(id, organizationId);
    return this.prisma.invoice.delete({ where: { id: existing.id } });
  }

  private async validateRelatedEntities(data: any, organizationId: string) {
    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: data.clientId, organizationId },
      });
      if (!client) {
        throw new BadRequestException('Client not found or does not belong to your organization');
      }
    }

    if (data.operationId) {
      const operation = await this.prisma.operation.findFirst({
        where: { id: data.operationId, organizationId },
      });
      if (!operation) {
        throw new BadRequestException('Operation not found or does not belong to your organization');
      }
    }

    if (data.bankAccountId) {
      const bankAccount = await this.prisma.bankAccount.findFirst({
        where: { id: data.bankAccountId, organizationId },
      });
      if (!bankAccount) {
        throw new BadRequestException('Bank account not found or does not belong to your organization');
      }
    }
  }
}
