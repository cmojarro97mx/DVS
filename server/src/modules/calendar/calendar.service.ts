import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(
    userId: string, 
    organizationId: string, 
    filters?: {
      emailAccountIds?: string[];
      includeLocal?: boolean;
      status?: string;
    }
  ) {
    const where: any = {
      userId,
      organizationId,
    };

    if (filters && (filters.emailAccountIds?.length || filters.includeLocal)) {
      const conditions = [];
      
      if (filters.emailAccountIds && filters.emailAccountIds.length > 0) {
        conditions.push({
          emailAccountId: {
            in: filters.emailAccountIds,
          },
        });
      }
      
      if (filters.includeLocal) {
        conditions.push({
          emailAccountId: null,
        });
      }
      
      if (conditions.length > 0) {
        where.OR = conditions;
      }
    }

    if (filters?.status) {
      where.status = filters.status;
    } else {
      where.status = {
        notIn: ['deleted'],
      };
    }

    return this.prisma.events.findMany({
      where,
      include: {
        email_accounts: {
          select: {
            id: true,
            email: true,
            provider: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.events.findUnique({ 
      where: { id },
      include: {
        email_accounts: {
          select: {
            id: true,
            email: true,
            provider: true,
          },
        },
      },
    });
  }

  async create(data: any) {
    const event = await this.prisma.events.create({ 
      data: {
        ...data,
        source: data.source || 'local',
        status: data.status || 'scheduled',
      },
    });
    
    if (event.source === 'local' && event.userId) {
      const eventDate = new Date(event.startDate);
      const formattedDate = eventDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      await this.notificationsService.sendNotificationToUser(event.userId, {
        title: 'Nuevo evento en tu calendario',
        body: `${event.title} - ${formattedDate}`,
        url: '/calendar',
        data: { type: 'event_created', eventId: event.id },
      });
    }
    
    return event;
  }

  async update(id: string, data: any) {
    const event = await this.prisma.events.update({ 
      where: { id }, 
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return event;
  }

  async remove(id: string) {
    const event = await this.prisma.events.findUnique({ where: { id } });
    
    if (event?.googleEventId && event?.emailAccountId) {
      await this.prisma.events.update({
        where: { id },
        data: { 
          status: 'deleted',
          lastSyncedAt: new Date(),
        },
      });
      return { soft: true, event };
    } else {
      return this.prisma.events.delete({ where: { id } });
    }
  }

  async getEventStats(userId: string, organizationId: string, accountId?: string) {
    const where: any = {
      userId,
      organizationId,
    };

    if (accountId) {
      where.emailAccountId = accountId;
    }

    const [total, scheduled, completed, cancelled] = await Promise.all([
      this.prisma.events.count({ where: { ...where, status: { notIn: ['deleted'] } } }),
      this.prisma.events.count({ where: { ...where, status: 'scheduled' } }),
      this.prisma.events.count({ where: { ...where, status: 'completed' } }),
      this.prisma.events.count({ where: { ...where, status: 'cancelled' } }),
    ]);

    return {
      total,
      scheduled,
      completed,
      cancelled,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldDeletedEvents() {
    try {
      this.logger.log('Starting cleanup of old deleted/cancelled events...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.events.deleteMany({
        where: {
          status: {
            in: ['deleted', 'cancelled'],
          },
          updatedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} old deleted/cancelled events`);
      return { deleted: result.count };
    } catch (error) {
      this.logger.error('Error cleaning up old events:', error);
      throw error;
    }
  }

  async cleanupEventsForDisconnectedAccounts() {
    try {
      this.logger.log('Checking for events with disconnected accounts...');
      
      const disconnectedAccounts = await this.prisma.email_accounts.findMany({
        where: {
          status: 'disconnected',
        },
        select: {
          id: true,
        },
      });

      if (disconnectedAccounts.length === 0) {
        this.logger.log('No disconnected accounts found');
        return { deleted: 0 };
      }

      const result = await this.prisma.events.deleteMany({
        where: {
          emailAccountId: {
            in: disconnectedAccounts.map(a => a.id),
          },
        },
      });

      this.logger.log(`Deleted ${result.count} events from disconnected accounts`);
      return { deleted: result.count };
    } catch (error) {
      this.logger.error('Error cleaning up events for disconnected accounts:', error);
      throw error;
    }
  }
}
