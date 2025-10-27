import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { randomUUID } from 'crypto';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('Notifications service initialized - Internal notifications only');
  }

  async sendNotificationToUser(userId: string, notification: NotificationPayload): Promise<void> {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { email: true, organizationId: true },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return;
      }

      await this.prisma.notifications.create({
        data: {
          id: randomUUID(),
          users: { connect: { id: userId } },
          organizations: { connect: { id: user.organizationId } },
          title: notification.title,
          body: notification.body,
          type: notification.data?.type || 'info',
          icon: notification.icon,
          url: notification.url,
          data: notification.data,
        },
      });

      this.logger.log(`Notification created for user ${userId}: ${notification.title}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}`, error);
    }
  }

  async sendNotificationToUsers(userIds: string[], notification: NotificationPayload): Promise<void> {
    await Promise.all(
      userIds.map((userId) => this.sendNotificationToUser(userId, notification)),
    );
  }

  async sendNotificationToOrganization(organizationId: string, notification: NotificationPayload): Promise<void> {
    const users = await this.prisma.users.findMany({
      where: { organizationId },
      select: { id: true },
    });

    await this.sendNotificationToUsers(
      users.map((u) => u.id),
      notification,
    );
  }

  async getUserNotificationSettings(userId: string) {
    let settings = await this.prisma.notification_settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.notification_settings.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
          users: { connect: { id: userId } },
          operationsEnabled: true,
          tasksEnabled: true,
          paymentsEnabled: true,
          invoicesEnabled: true,
          expensesEnabled: true,
          calendarEnabled: true,
          emailsEnabled: true,
        },
      });
    }

    return settings;
  }

  async updateNotificationSettings(userId: string, settings: any) {
    return this.prisma.notification_settings.upsert({
      where: { userId },
      create: {
        users: { connect: { id: userId } },
        ...settings,
      },
      update: settings,
    });
  }

  async getUserNotifications(userId: string, limit: number = 20) {
    return this.prisma.notifications.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notifications.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notifications.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notifications.deleteMany({
      where: {
        userId,
      },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notifications.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }
}
