import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { GmailService } from './gmail.service';

@Controller('gmail')
@UseGuards(JwtAuthGuard)
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.gmailService.getProfile(req.user.userId);
  }

  @Get('messages')
  async listMessages(
    @Request() req,
    @Query('maxResults') maxResults?: string,
    @Query('q') query?: string,
  ) {
    return this.gmailService.listMessages(
      req.user.userId,
      maxResults ? parseInt(maxResults) : 50,
      query,
    );
  }

  @Get('messages/:messageId')
  async getMessage(
    @Request() req,
    @Param('messageId') messageId: string,
  ) {
    return this.gmailService.getMessage(req.user.userId, messageId);
  }

  @Post('messages/send')
  async sendMessage(
    @Request() req,
    @Body() emailData: {
      to: string;
      subject: string;
      body: string;
      cc?: string;
      bcc?: string;
    },
  ) {
    return this.gmailService.sendMessage(req.user.userId, emailData);
  }

  @Post('messages/:messageId/reply')
  async replyToMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body() replyData: {
      body: string;
      cc?: string;
      bcc?: string;
    },
  ) {
    return this.gmailService.replyToMessage(req.user.userId, messageId, replyData);
  }

  @Delete('messages/:messageId')
  async deleteMessage(
    @Request() req,
    @Param('messageId') messageId: string,
  ) {
    return this.gmailService.deleteMessage(req.user.userId, messageId);
  }

  @Put('messages/:messageId/read')
  async markAsRead(
    @Request() req,
    @Param('messageId') messageId: string,
  ) {
    return this.gmailService.markAsRead(req.user.userId, messageId);
  }

  @Put('messages/:messageId/unread')
  async markAsUnread(
    @Request() req,
    @Param('messageId') messageId: string,
  ) {
    return this.gmailService.markAsUnread(req.user.userId, messageId);
  }

  @Get('labels')
  async listLabels(@Request() req) {
    return this.gmailService.listLabels(req.user.userId);
  }

  @Post('messages/:messageId/labels/:labelId')
  async addLabel(
    @Request() req,
    @Param('messageId') messageId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.gmailService.addLabel(req.user.userId, messageId, labelId);
  }

  @Delete('messages/:messageId/labels/:labelId')
  async removeLabel(
    @Request() req,
    @Param('messageId') messageId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.gmailService.removeLabel(req.user.userId, messageId, labelId);
  }
}
