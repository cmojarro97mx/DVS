import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseGuards, Request, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.notificationsService.getUserNotifications(req.user.userId, parsedLimit);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Post(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(id, req.user.userId);
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
    return { publicKey: this.notificationsService.getVapidPublicKey() };
  }

  @Post('subscribe')
  async subscribe(
    @Request() req,
    @Body() body: { subscription: any },
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.notificationsService.subscribeToPush(
      req.user.userId,
      body.subscription,
      userAgent,
    );
  }

  @Delete('subscribe')
  async unsubscribe(@Request() req, @Body() body: { endpoint: string }) {
    return this.notificationsService.unsubscribeFromPush(req.user.userId, body.endpoint);
  }

  @Get('subscriptions')
  async getSubscriptions(@Request() req) {
    return this.notificationsService.getUserSubscriptions(req.user.userId);
  }
}
