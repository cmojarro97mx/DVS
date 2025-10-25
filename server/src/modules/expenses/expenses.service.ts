import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.expenses.findMany({
      where: { organizationId },
      include: {
        users: true,
        operations: true,
        bank_accounts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const expense = await this.prisma.expenses.findFirst({
      where: { id, organizationId },
      include: {
        users: true,
        operations: true,
        bank_accounts: true,
      },
    });
    
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    
    return expense;
  }

  async create(data: any, organizationId: string, userId: string) {
    await this.validateRelatedEntities(data, organizationId);
    
    const expense = await this.prisma.expenses.create({
      data: {
        ...data,
        organizationId,
        userId,
      },
      include: {
        users: true,
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
          title: 'Nuevo gasto registrado',
          body: `Se ha registrado un nuevo gasto por ${data.amount} ${data.currency}`,
          url: `/expenses/${expense.id}`,
          data: { type: 'expense_created', expenseId: expense.id },
        },
      );
    }

    return expense;
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await this.findOne(id, organizationId);
    
    await this.validateRelatedEntities(data, organizationId);
    
    const { organizationId: _, userId: __, ...updateData } = data;
    
    return this.prisma.expenses.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        users: true,
        operations: true,
        bank_accounts: true,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.findOne(id, organizationId);
    return this.prisma.expenses.delete({ where: { id: existing.id } });
  }

  private async validateRelatedEntities(data: any, organizationId: string) {
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
