import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma.service';
import { firstValueFrom } from 'rxjs';

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
  ) {}

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

      const token = await this.getAccessToken();
      if (!token || !this.websiteId) {
        this.logger.warn('SendPulse not configured, skipping push notification');
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

      this.logger.log(`Notification sent to user ${userId}: ${notification.title}`);
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
}
