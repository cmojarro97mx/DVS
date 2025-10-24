import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.logger.log('✅ NotificationsScheduler initialized - Cron jobs active');
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkUpcomingEvents() {
    this.logger.log('🔔 Checking for upcoming calendar events...');
    
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const upcomingEvents = await this.prisma.event.findMany({
        where: {
          startDate: {
            gte: today,
            lt: tomorrow,
          },
          notificationSent: {
            not: true,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      for (const event of upcomingEvents) {
        const eventDate = new Date(event.startDate);
        const hasSpecificTime = eventDate.getHours() !== 0 || eventDate.getMinutes() !== 0;
        
        let title: string;
        let body: string;

        if (hasSpecificTime) {
          const minutesUntil = Math.floor((event.startDate.getTime() - now.getTime()) / (1000 * 60));
          const hoursUntil = Math.floor(minutesUntil / 60);
          
          if (minutesUntil < 0) continue;
          if (minutesUntil > 60) continue;
          
          title = `Evento próximo: ${event.title}`;
          if (hoursUntil > 0) {
            body = `Tu evento comienza en ${hoursUntil} hora${hoursUntil > 1 ? 's' : ''}`;
          } else {
            body = `Tu evento comienza en ${minutesUntil} minutos`;
          }
        } else {
          title = `Evento de hoy: ${event.title}`;
          body = `Tienes un evento programado para hoy`;
        }
        
        if (event.user) {
          await this.notificationsService.sendNotificationToUser(event.user.id, {
            title,
            body,
            url: '/calendar',
            icon: '/icons/calendar.png',
            data: {
              eventId: event.id,
              type: 'upcoming_event',
            },
          });

          await this.prisma.event.update({
            where: { id: event.id },
            data: { notificationSent: true },
          });

          this.logger.log(`Notification sent for event: ${event.title} to user ${event.user.email}`);
        } else {
          await this.notificationsService.sendNotificationToOrganization(event.organizationId, {
            title,
            body,
            url: '/calendar',
            icon: '/icons/calendar.png',
            data: {
              eventId: event.id,
              type: 'upcoming_event',
            },
          });

          await this.prisma.event.update({
            where: { id: event.id },
            data: { notificationSent: true },
          });

          this.logger.log(`Notification sent for event: ${event.title} to organization`);
        }
      }

      if (upcomingEvents.length > 0) {
        this.logger.log(`Processed ${upcomingEvents.length} upcoming event notifications`);
      }
    } catch (error) {
      this.logger.error('Error checking upcoming events', error);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkPendingTasks() {
    this.logger.log('📋 Checking for overdue tasks...');
    
    try {
      const now = new Date();

      const overdueTasks = await this.prisma.task.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            not: 'Done',
          },
          overdueNotificationSent: {
            not: true,
          },
        },
        include: {
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

      for (const task of overdueTasks) {
        if (task.assignees && task.assignees.length > 0) {
          const assigneeUserIds = task.assignees.map(a => a.userId);
          await this.notificationsService.sendNotificationToUsers(assigneeUserIds, {
            title: `Tarea vencida: ${task.title}`,
            body: `Esta tarea venció el ${task.dueDate.toLocaleDateString()}`,
            url: `/tasks`,
            icon: '/icons/task.png',
            data: {
              taskId: task.id,
              type: 'overdue_task',
            },
          });

          await this.prisma.task.update({
            where: { id: task.id },
            data: { overdueNotificationSent: true },
          });

          this.logger.log(`Overdue task notification sent for task: ${task.title}`);
        }
      }

      if (overdueTasks.length > 0) {
        this.logger.log(`Processed ${overdueTasks.length} overdue task notifications`);
      }
    } catch (error) {
      this.logger.error('Error checking overdue tasks', error);
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkPendingInvoices() {
    this.logger.log('💰 Checking for pending invoices...');
    
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const pendingInvoices = await this.prisma.invoice.findMany({
        where: {
          dueDate: {
            gte: now,
            lte: threeDaysFromNow,
          },
          status: 'pending',
          reminderSent: {
            not: true,
          },
        },
        include: {
          client: {
            select: {
              name: true,
            },
          },
        },
      });

      for (const invoice of pendingInvoices) {
        const daysUntilDue = Math.ceil((invoice.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        await this.notificationsService.sendNotificationToOrganization(invoice.organizationId, {
          title: `Factura próxima a vencer: ${invoice.invoiceNumber}`,
          body: `La factura de ${invoice.client.name} vence en ${daysUntilDue} días`,
          url: `/invoices`,
          icon: '/icons/invoice.png',
          data: {
            invoiceId: invoice.id,
            type: 'pending_invoice',
          },
        });

        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { reminderSent: true },
        });

        this.logger.log(`Invoice reminder sent for invoice ${invoice.invoiceNumber}`);
      }

      if (pendingInvoices.length > 0) {
        this.logger.log(`Processed ${pendingInvoices.length} invoice reminder notifications`);
      }
    } catch (error) {
      this.logger.error('Error checking pending invoices', error);
    }
  }

  @Cron('0 9 * * *')
  async sendDailySummary() {
    this.logger.log('📊 Sending daily summary notifications...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const organizations = await this.prisma.organization.findMany({
        select: { id: true },
      });

      for (const org of organizations) {
        const todayEvents = await this.prisma.event.count({
          where: {
            organizationId: org.id,
            startDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        });

        const pendingTasks = await this.prisma.task.count({
          where: {
            organizationId: org.id,
            status: {
              not: 'Done',
            },
            dueDate: {
              lte: tomorrow,
            },
          },
        });

        const activeOperations = await this.prisma.operation.count({
          where: {
            organizationId: org.id,
            status: {
              in: ['active', 'in_progress'],
            },
          },
        });

        if (todayEvents > 0 || pendingTasks > 0) {
          const summaryParts = [];
          if (todayEvents > 0) summaryParts.push(`${todayEvents} eventos`);
          if (pendingTasks > 0) summaryParts.push(`${pendingTasks} tareas pendientes`);
          if (activeOperations > 0) summaryParts.push(`${activeOperations} operaciones activas`);

          await this.notificationsService.sendNotificationToOrganization(org.id, {
            title: 'Resumen del día',
            body: `Hoy tienes: ${summaryParts.join(', ')}`,
            url: '/dashboard',
            icon: '/icons/summary.png',
            data: {
              type: 'daily_summary',
              stats: {
                events: todayEvents,
                tasks: pendingTasks,
                operations: activeOperations,
              },
            },
          });

          this.logger.log(`Daily summary sent to organization ${org.id}`);
        }
      }
    } catch (error) {
      this.logger.error('Error sending daily summary', error);
    }
  }
}
