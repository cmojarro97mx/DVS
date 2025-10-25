import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.payments.findMany({
      where: { organizationId },
      include: {
        invoices: true,
        operations: true,
        bank_accounts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const payment = await this.prisma.payments.findFirst({
      where: { id, organizationId },
      include: {
        invoices: true,
        operations: true,
        bank_accounts: true,
      },
    });
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    
    return payment;
  }

  async create(data: any, organizationId: string) {
    await this.validateRelatedEntities(data, organizationId);
    
    const payment = await this.prisma.payments.create({
      data: {
        ...data,
        organizationId,
      },
      include: {
        invoices: true,
        operations: true,
        bank_accounts: true,
      },
    });

    const admins = await this.prisma.users.findMany({
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
          title: 'Nuevo pago registrado',
          body: `Se ha registrado un nuevo pago por ${payment.amount} ${payment.currency}`,
          url: `/payments/${payment.id}`,
          data: { type: 'payment_created', paymentId: payment.id },
        },
      );
    }

    return payment;
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await this.findOne(id, organizationId);
    
    await this.validateRelatedEntities(data, organizationId);
    
    const { organizationId: _, ...updateData } = data;
    
    return this.prisma.payments.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        invoices: true,
        operations: true,
        bank_accounts: true,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.findOne(id, organizationId);
    return this.prisma.payments.delete({ where: { id: existing.id } });
  }

  private async validateRelatedEntities(data: any, organizationId: string) {
    if (data.invoiceId) {
      const invoice = await this.prisma.invoices.findFirst({
        where: { id: data.invoiceId, organizationId },
      });
      if (!invoice) {
        throw new BadRequestException('Invoice not found or does not belong to your organization');
      }
    }

    if (data.operationId) {
      const operation = await this.prisma.operations.findFirst({
        where: { id: data.operationId, organizationId },
      });
      if (!operation) {
        throw new BadRequestException('Operation not found or does not belong to your organization');
      }
    }

    if (data.bankAccountId) {
      const bankAccount = await this.prisma.bank_accounts.findFirst({
        where: { id: data.bankAccountId, organizationId },
      });
      if (!bankAccount) {
        throw new BadRequestException('Bank account not found or does not belong to your organization');
      }
    }
  }
}
