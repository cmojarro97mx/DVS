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
        syncFromDate: true,
        detectedOldestEmailDate: true,
        detectedNewestEmailDate: true,
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

    // Build filter to respect syncFromDate
    const dateFilter = account.syncFromDate 
      ? { date: { gte: account.syncFromDate } } 
      : {};

    const downloadedMessages = await this.prisma.emailMessage.count({
      where: { accountId, ...dateFilter },
    });

    const repliedMessages = await this.prisma.emailMessage.count({
      where: { accountId, isReplied: true, ...dateFilter },
    });

    const unrepliedMessages = await this.prisma.emailMessage.count({
      where: { accountId, isReplied: false, folder: { not: 'sent' }, ...dateFilter },
    });

    const unreadMessages = await this.prisma.emailMessage.count({
      where: { accountId, unread: true, ...dateFilter },
    });

    return {
      totalMessages,
      downloadedMessages,
      repliedMessages,
      unrepliedMessages,
      unreadMessages,
      lastSync: account.lastEmailSync,
      syncFromDate: account.syncFromDate,
      detectedOldestEmailDate: account.detectedOldestEmailDate,
      detectedNewestEmailDate: account.detectedNewestEmailDate,
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

    // Filter by syncFromDate if configured
    if (account.syncFromDate) {
      where.date = { gte: account.syncFromDate };
    }

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
    console.log('[Discovery] Request received for accountId:', accountId, 'userId:', user.userId);

    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, userId: user.userId },
    });

    if (!account) {
      console.log('[Discovery] Account not found');
      return { error: 'Account not found' };
    }

    console.log('[Discovery] Account found:', account.email);

    if (account.detectedOldestEmailDate && account.detectedNewestEmailDate) {
      console.log('[Discovery] Using cached discovery data');
      return {
        oldestEmailDate: account.detectedOldestEmailDate,
        newestEmailDate: account.detectedNewestEmailDate,
        estimatedTotalMessages: account.estimatedTotalMessages || account.totalMessagesInGmail,
        cached: true,
      };
    }

    console.log('[Discovery] Running discovery process...');
    try {
      const discovery = await this.emailSyncService.discoverEmailDateRange(user.userId, accountId);
      console.log('[Discovery] Discovery completed successfully:', discovery);

      return {
        ...discovery,
        cached: false,
      };
    } catch (error) {
      console.error('[Discovery] Error during discovery:', error);
      throw error;
    }
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

  @Get('accounts/:accountId/messages/:messageId')
  async getMessage(
    @Param('accountId') accountId: string,
    @Param('messageId') messageId: string,
    @Req() req: any,
  ) {
    return this.emailSyncService.getMessage(accountId, messageId, req.user.organizationId);
  }

  @Get('attachment-url/:b2Key')
  async getAttachmentUrl(
    @Param('b2Key') b2Key: string,
    @Req() req: any,
  ) {
    // Decode the b2Key from URL encoding
    const decodedKey = decodeURIComponent(b2Key);
    const url = await this.emailSyncService.getAttachmentUrl(decodedKey);
    return { url };
  }
}