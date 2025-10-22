import { Controller, Post, Get, UseGuards, Req, Query, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { EmailSyncService } from './email-sync.service';
import { EmailStorageService } from '../email-storage/email-storage.service';
import { PrismaService } from '../../common/prisma.service';
import { Request } from 'express';

@Controller('email-sync')
@UseGuards(JwtAuthGuard)
export class EmailSyncController {
  constructor(
    private readonly emailSyncService: EmailSyncService,
    private readonly emailStorageService: EmailStorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('sync/:accountId')
  async syncAccount(@Req() req: Request, @Param('accountId') accountId: string) {
    const user = req.user as any;
    const result = await this.emailSyncService.syncEmailsForAccount(user.userId, accountId);
    return {
      message: 'Email sync completed',
      ...result,
    };
  }

  @Get('accounts')
  async getAccounts(@Req() req: Request) {
    const user = req.user as any;
    const accounts = await this.prisma.emailAccount.findMany({
      where: {
        userId: user.userId,
        syncEmail: true,
      },
      select: {
        id: true,
        email: true,
        provider: true,
        status: true,
        syncEmail: true,
        lastEmailSync: true,
        totalMessagesInGmail: true,
        syncedMessagesCount: true,
      },
    });
    return accounts;
  }

  @Get('metrics/:accountId')
  async getMetrics(@Req() req: Request, @Param('accountId') accountId: string) {
    const user = req.user as any;
    
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, userId: user.userId },
    });

    if (!account) {
      return { error: 'Account not found' };
    }

    const totalMessages = account.totalMessagesInGmail;
    const downloadedMessages = await this.prisma.emailMessage.count({
      where: { accountId },
    });

    const repliedMessages = await this.prisma.emailMessage.count({
      where: { accountId, isReplied: true },
    });

    const unrepliedMessages = await this.prisma.emailMessage.count({
      where: { accountId, isReplied: false, folder: { not: 'sent' } },
    });

    const unreadMessages = await this.prisma.emailMessage.count({
      where: { accountId, unread: true },
    });

    return {
      totalMessages,
      downloadedMessages,
      repliedMessages,
      unrepliedMessages,
      unreadMessages,
      lastSync: account.lastEmailSync,
    };
  }

  @Get('messages/:accountId')
  async getMessages(
    @Req() req: Request,
    @Param('accountId') accountId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('folder') folder?: string,
    @Query('unread') unread?: string,
  ) {
    const user = req.user as any;
    
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, userId: user.userId },
    });

    if (!account) {
      return { error: 'Account not found' };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { accountId };
    if (folder) {
      where.folder = folder;
    }
    if (unread === 'true') {
      where.unread = true;
    }

    const [messages, total] = await Promise.all([
      this.prisma.emailMessage.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          gmailMessageId: true,
          threadId: true,
          from: true,
          fromName: true,
          to: true,
          cc: true,
          subject: true,
          snippet: true,
          date: true,
          unread: true,
          starred: true,
          isReplied: true,
          hasAttachments: true,
          folder: true,
          labels: true,
        },
      }),
      this.prisma.emailMessage.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get('message/:messageId')
  async getMessage(@Req() req: Request, @Param('messageId') messageId: string) {
    const user = req.user as any;
    
    const message = await this.prisma.emailMessage.findFirst({
      where: {
        id: messageId,
        account: {
          userId: user.userId,
        },
      },
      include: {
        account: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!message) {
      return { error: 'Message not found' };
    }

    let htmlBodyContent = message.htmlBodyUrl;
    if (message.htmlBodyKey) {
      htmlBodyContent = await this.emailStorageService.getSignedUrl(message.htmlBodyKey);
    }

    const attachmentsWithUrls = message.attachmentsData 
      ? await Promise.all(
          (message.attachmentsData as any[]).map(async (att) => ({
            ...att,
            url: await this.emailStorageService.getSignedUrl(att.key),
          }))
        )
      : [];

    return {
      ...message,
      htmlBodyContent,
      attachments: attachmentsWithUrls,
    };
  }

  @Get('html/:messageId')
  async getHtmlBody(@Req() req: Request, @Param('messageId') messageId: string) {
    const user = req.user as any;
    
    const message = await this.prisma.emailMessage.findFirst({
      where: {
        id: messageId,
        account: {
          userId: user.userId,
        },
      },
      select: {
        htmlBodyKey: true,
        htmlBodyUrl: true,
      },
    });

    if (!message) {
      return { error: 'Message not found' };
    }

    if (message.htmlBodyKey) {
      const signedUrl = await this.emailStorageService.getSignedUrl(message.htmlBodyKey);
      return { url: signedUrl };
    }

    if (message.htmlBodyUrl) {
      return { content: message.htmlBodyUrl };
    }

    return { error: 'No HTML body found' };
  }

  @Get('accounts/:accountId/discovery')
  async discoverDateRange(@Req() req: Request, @Param('accountId') accountId: string) {
    const user = req.user as any;
    
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, userId: user.userId },
    });

    if (!account) {
      return { error: 'Account not found' };
    }

    if (account.detectedOldestEmailDate && account.detectedNewestEmailDate) {
      return {
        oldestEmailDate: account.detectedOldestEmailDate,
        newestEmailDate: account.detectedNewestEmailDate,
        estimatedTotalMessages: account.estimatedTotalMessages || account.totalMessagesInGmail,
        cached: true,
      };
    }

    const discovery = await this.emailSyncService.discoverEmailDateRange(user.userId, accountId);
    
    return {
      ...discovery,
      cached: false,
    };
  }

  @Post('accounts/:accountId/settings')
  async updateSettings(
    @Req() req: Request,
    @Param('accountId') accountId: string,
    @Body() body: { syncFromDate: string },
  ) {
    const user = req.user as any;
    
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, userId: user.userId },
    });

    if (!account) {
      return { error: 'Account not found' };
    }

    const syncFromDate = new Date(body.syncFromDate);
    await this.emailSyncService.updateSyncSettings(user.userId, accountId, syncFromDate);

    return {
      message: 'Sync settings updated successfully',
      syncFromDate,
    };
  }
}
