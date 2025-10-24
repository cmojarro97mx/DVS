import { Controller, Get, Put, Delete, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../common/prisma.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getNotifications(@Request() req, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.notificationsService.getUserNotifications(req.user.userId, limitNum);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Put(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    await this.notificationsService.markAsRead(id, req.user.userId);
    return { success: true };
  }

  @Put('read-all')
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    await this.notificationsService.deleteNotification(id, req.user.userId);
    return { success: true };
  }

  @Get('settings')
  async getSettings(@Request() req) {
    return this.notificationsService.getUserNotificationSettings(req.user.userId);
  }

  @Put('settings')
  async updateSettings(@Request() req, @Body() settings: any) {
    return this.notificationsService.updateNotificationSettings(req.user.userId, settings);
  }

  @Get('vapid-public-key')
  async getVapidPublicKey() {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
    };
  }

  @Post('push-subscription')
  async createPushSubscription(@Request() req, @Body() body: any) {
    const { subscription } = body;
    const userId = req.user.userId;

    const existing = await this.prisma.pushSubscription.findFirst({
      where: {
        userId,
        endpoint: subscription.endpoint,
      },
    });

    if (existing) {
      return { success: true, existing: true };
    }

    await this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: body.userAgent || null,
      },
    });

    return { success: true, existing: false };
  }

  @Delete('push-subscription')
  async deletePushSubscription(@Request() req, @Body() body: any) {
    const { endpoint } = body;
    const userId = req.user.userId;

    await this.prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint: endpoint || undefined,
      },
    });

    return { success: true };
  }
}
