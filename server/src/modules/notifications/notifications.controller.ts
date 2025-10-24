import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('settings')
  async getSettings(@Request() req) {
    return this.notificationsService.getUserNotificationSettings(req.user.userId);
  }

  @Put('settings')
  async updateSettings(@Request() req, @Body() settings: any) {
    return this.notificationsService.updateNotificationSettings(req.user.userId, settings);
  }
}
