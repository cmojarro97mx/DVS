import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import * as webPush from 'web-push';

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
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const mailto = process.env.VAPID_MAILTO || 'mailto:admin@nexxio.com';

    if (publicKey && privateKey) {
      webPush.setVapidDetails(mailto, publicKey, privateKey);
      this.logger.log('Web Push configured successfully');
    } else {
      this.logger.warn('VAPID keys not configured, web push notifications will not work');
    }
  }

  async sendNotificationToUser(userId: string, notification: NotificationPayload): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, organizationId: true },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return;
      }

      await this.prisma.notification.create({
        data: {
          userId,
          organizationId: user.organizationId,
          title: notification.title,
          body: notification.body,
          type: notification.data?.type || 'info',
          icon: notification.icon,
          url: notification.url,
          data: notification.data,
        },
      });

      const userSettings = await this.prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (userSettings && !userSettings.pushEnabled) {
        this.logger.debug(`Push notifications disabled for user ${userId}`);
        return;
      }

      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId },
      });

      if (subscriptions.length === 0) {
        this.logger.debug(`No push subscriptions found for user ${userId}`);
        return;
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/logo.png',
        url: notification.url || '/',
        data: notification.data,
      });

      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webPush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys as any,
              },
              payload,
            );

            await this.prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { lastUsedAt: new Date() },
            });

            this.logger.log(`Push notification sent to subscription ${sub.id}`);
          } catch (error) {
            if (error.statusCode === 410) {
              this.logger.warn(`Subscription expired, removing: ${sub.id}`);
              await this.prisma.pushSubscription.delete({
                where: { id: sub.id },
              });
            } else {
              this.logger.error(`Failed to send push notification to subscription ${sub.id}`, error);
            }
          }
        }),
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      this.logger.log(
        `Notification sent to user ${userId}: ${notification.title} (${successful}/${subscriptions.length} subscriptions)`,
      );
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
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      select: { id: true },
    });

    await this.sendNotificationToUsers(
      users.map((u) => u.id),
      notification,
    );
  }

  async getUserNotificationSettings(userId: string) {
    let settings = await this.prisma.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.notificationSettings.create({
        data: {
          userId,
          pushEnabled: true,
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
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...settings,
      },
      update: settings,
    });
  }

  async getUserNotifications(userId: string, limit: number = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
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
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  async subscribeToPush(userId: string, subscription: any, userAgent?: string) {
    try {
      const existing = await this.prisma.pushSubscription.findUnique({
        where: { endpoint: subscription.endpoint },
      });

      if (existing) {
        return this.prisma.pushSubscription.update({
          where: { endpoint: subscription.endpoint },
          data: {
            keys: subscription.keys,
            userAgent,
            lastUsedAt: new Date(),
          },
        });
      }

      return this.prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.error('Failed to save push subscription', error);
      throw error;
    }
  }

  async unsubscribeFromPush(userId: string, endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });
  }

  async getUserSubscriptions(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  getVapidPublicKey(): string {
    return process.env.VAPID_PUBLIC_KEY || '';
  }
}
