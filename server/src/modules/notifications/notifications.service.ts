import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { firstValueFrom } from 'rxjs';
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
  private readonly apiUrl = 'https://api.sendpulse.com';
  private readonly websiteId = process.env.SENDPULSE_WEBSITE_ID;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidMailto = process.env.VAPID_MAILTO || 'mailto:admin@nexxio.com';

    if (vapidPublicKey && vapidPrivateKey) {
      webPush.setVapidDetails(vapidMailto, vapidPublicKey, vapidPrivateKey);
      this.logger.log('✅ Web Push configured with VAPID keys');
    } else {
      this.logger.warn('⚠️ VAPID keys not configured, push notifications will not work');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const apiId = process.env.SENDPULSE_API_ID;
    const apiSecret = process.env.SENDPULSE_API_SECRET;

    if (!apiId || !apiSecret) {
      this.logger.warn('SendPulse API credentials not configured');
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/oauth/access_token`, {
          grant_type: 'client_credentials',
          client_id: apiId,
          client_secret: apiSecret,
        }),
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get SendPulse access token', error);
      return null;
    }
  }

  async createNotification(userId: string, notification: NotificationPayload & { type: string }) {
    try {
      const createdNotification = await this.prisma.notification.create({
        data: {
          userId,
          title: notification.title,
          message: notification.body,
          type: notification.type,
          url: notification.url,
          data: notification.data,
        },
      });

      this.logger.log(`Notification created in DB for user ${userId}: ${notification.title}`);
      return createdNotification;
    } catch (error) {
      this.logger.error(`Failed to create notification in DB for user ${userId}`, error);
      throw error;
    }
  }

  async sendNotificationToUser(userId: string, notification: NotificationPayload & { type: string }): Promise<void> {
    try {
      const createdNotification = await this.createNotification(userId, notification);

      this.notificationsGateway.sendNotificationToUser(userId, createdNotification);
      this.logger.log(`📡 WebSocket notification sent to user ${userId}`);

      await this.sendWebPushNotification(userId, notification);

      const userSettings = await this.prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (userSettings && !userSettings.pushEnabled) {
        this.logger.debug(`Push notifications disabled for user ${userId}`);
        return;
      }

      const token = await this.getAccessToken();
      if (!token || !this.websiteId) {
        this.logger.debug('SendPulse not configured, skipping SendPulse push notification');
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return;
      }

      const payload = {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/logo.png',
        link: notification.url || '/',
        ttl: 86400,
        buttons: notification.data?.buttons || [],
        filters: [
          {
            variable_name: 'email',
            operator: 'eq',
            conditions: [
              {
                value: user.email,
              },
            ],
          },
        ],
      };

      await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/push/tasks/${this.websiteId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      this.logger.log(`SendPulse notification sent to user ${userId}: ${notification.title}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}`, error);
    }
  }

  async sendWebPushNotification(userId: string, notification: NotificationPayload): Promise<void> {
    try {
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId },
      });

      if (subscriptions.length === 0) {
        this.logger.debug(`No push subscriptions found for user ${userId}`);
        return;
      }

      const pushPayload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon-192.png',
        url: notification.url || '/',
        data: notification.data,
      });

      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webPush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              pushPayload,
            );
            return { success: true, subscriptionId: sub.id };
          } catch (error) {
            if (error.statusCode === 410 || error.statusCode === 404) {
              await this.prisma.pushSubscription.delete({
                where: { id: sub.id },
              });
              this.logger.debug(`Removed expired push subscription ${sub.id}`);
            }
            throw error;
          }
        }),
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      this.logger.log(`🔔 Web Push sent to ${successCount}/${subscriptions.length} subscriptions for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending web push notifications for user ${userId}`, error);
    }
  }

  async sendNotificationToUsers(userIds: string[], notification: NotificationPayload & { type: string }): Promise<void> {
    await Promise.all(
      userIds.map((userId) => this.sendNotificationToUser(userId, notification)),
    );
  }

  async sendNotificationToOrganization(organizationId: string, notification: NotificationPayload & { type: string }): Promise<void> {
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

  async getUserNotifications(userId: string, limit: number = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
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
}
