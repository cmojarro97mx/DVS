import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { GmailService } from './gmail.service';

@Controller('gmail')
@UseGuards(JwtAuthGuard)
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('profile')
  async getProfile(@Request() req, @Query('accountId') accountId?: string) {
    return this.gmailService.getProfile(req.user.userId, accountId);
  }

  @Get('messages')
  async listMessages(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('maxResults') maxResults?: string,
    @Query('q') query?: string,
  ) {
    return this.gmailService.listMessages(
      req.user.userId,
      accountId,
      maxResults ? parseInt(maxResults) : 50,
      query,
    );
  }

  @Get('messages/:messageId')
  async getMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.gmailService.getMessage(req.user.userId, messageId, accountId);
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
      accountId?: string;
    },
  ) {
    return this.gmailService.sendMessage(req.user.userId, emailData, emailData.accountId);
  }

  @Post('messages/:messageId/reply')
  async replyToMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body() replyData: {
      body: string;
      cc?: string;
      bcc?: string;
      accountId?: string;
    },
  ) {
    return this.gmailService.replyToMessage(req.user.userId, messageId, replyData, replyData.accountId);
  }

  @Delete('messages/:messageId')
  async deleteMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.gmailService.deleteMessage(req.user.userId, messageId, accountId);
  }

  @Put('messages/:messageId/read')
  async markAsRead(
    @Request() req,
    @Param('messageId') messageId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.gmailService.markAsRead(req.user.userId, messageId, accountId);
  }

  @Put('messages/:messageId/unread')
  async markAsUnread(
    @Request() req,
    @Param('messageId') messageId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.gmailService.markAsUnread(req.user.userId, messageId, accountId);
  }

  @Get('labels')
  async listLabels(@Request() req, @Query('accountId') accountId?: string) {
    return this.gmailService.listLabels(req.user.userId, accountId);
  }

  @Post('messages/:messageId/labels/:labelId')
  async addLabel(
    @Request() req,
    @Param('messageId') messageId: string,
    @Param('labelId') labelId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.gmailService.addLabel(req.user.userId, messageId, labelId, accountId);
  }

  @Delete('messages/:messageId/labels/:labelId')
  async removeLabel(
    @Request() req,
    @Param('messageId') messageId: string,
    @Param('labelId') labelId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.gmailService.removeLabel(req.user.userId, messageId, labelId, accountId);
  }
}
