import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { google } from 'googleapis';
import { PrismaService } from '../../common/prisma.service';
import { GoogleAuthService } from '../google-auth/google-auth.service';
import { EmailStorageService } from '../email-storage/email-storage.service';

@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);

  constructor(
    private prisma: PrismaService,
    private googleAuthService: GoogleAuthService,
    private emailStorageService: EmailStorageService,
  ) {}

  async syncEmailsForAccount(userId: string, accountId: string): Promise<{ synced: number; total: number }> {
    this.logger.log(`Starting email sync for account ${accountId}`);
    
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account || !account.syncEmail) {
      throw new Error('Account not found or sync not enabled');
    }

    const accessToken = await this.googleAuthService.getAccessToken(userId, accountId);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const profile = await gmail.users.getProfile({ userId: 'me' });
    const totalMessages = profile.data.messagesTotal || 0;

    let syncedCount = 0;
    let pageToken: string | undefined;
    
    const query = account.syncFromDate 
      ? `after:${this.formatDateForGmailQuery(account.syncFromDate)}`
      : undefined;
    
    if (query) {
      this.logger.log(`Filtering emails with query: ${query}`);
    }
    
    do {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 100,
        pageToken,
        q: query,
      });

      const messages = response.data.messages || [];
      
      for (const message of messages) {
        try {
          await this.syncSingleMessage(gmail, accountId, message.id);
          syncedCount++;
          
          if (syncedCount % 10 === 0) {
            this.logger.log(`Synced ${syncedCount} of ${totalMessages} messages`);
          }
        } catch (error) {
          this.logger.error(`Failed to sync message ${message.id}:`, error.message);
        }
      }

      pageToken = response.data.nextPageToken;
    } while (pageToken);

    await this.prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        lastEmailSync: new Date(),
        totalMessagesInGmail: totalMessages,
        syncedMessagesCount: syncedCount,
      },
    });

    this.logger.log(`Completed sync for account ${accountId}: ${syncedCount}/${totalMessages} messages`);
    return { synced: syncedCount, total: totalMessages };
  }

  private async syncSingleMessage(gmail: any, accountId: string, messageId: string): Promise<void> {
    const existing = await this.prisma.emailMessage.findFirst({
      where: { accountId, gmailMessageId: messageId },
    });

    if (existing) {
      return;
    }

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    const headers = message.payload?.headers || [];

    const getHeader = (name: string) => 
      headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const from = getHeader('from');
    const to = getHeader('to');
    const cc = getHeader('cc');
    const bcc = getHeader('bcc');
    const subject = getHeader('subject');
    const messageIdHeader = getHeader('message-id');
    const inReplyTo = getHeader('in-reply-to');
    const references = getHeader('references');
    const date = getHeader('date');

    const { textBody, htmlBody } = this.extractBodies(message.payload);
    
    let htmlBodyKey: string | null = null;
    if (htmlBody && htmlBody.length > 1000) {
      try {
        htmlBodyKey = await this.emailStorageService.uploadEmailHtml(accountId, messageId, htmlBody);
      } catch (error) {
        this.logger.error(`Failed to upload HTML body for message ${messageId}:`, error.message);
      }
    }

    const attachments = await this.extractAttachments(gmail, message, accountId, messageId);
    
    const hasAttachments = attachments.length > 0;
    const attachmentsData = hasAttachments ? attachments : null;

    const isUnread = message.labelIds?.includes('UNREAD') || false;
    const isStarred = message.labelIds?.includes('STARRED') || false;
    const isReplied = message.labelIds?.includes('SENT') || !!inReplyTo;

    await this.prisma.emailMessage.create({
      data: {
        gmailMessageId: messageId,
        threadId: message.threadId,
        accountId,
        folder: this.getFolderFromLabels(message.labelIds || []),
        labels: message.labelIds || [],
        from,
        fromName: this.extractName(from),
        to: this.parseEmailList(to),
        cc: cc ? this.parseEmailList(cc) : null,
        bcc: bcc ? this.parseEmailList(bcc) : null,
        subject: subject || '(Sin asunto)',
        snippet: message.snippet || '',
        body: textBody || message.snippet || '',
        htmlBodyKey,
        htmlBodyUrl: htmlBodyKey ? null : (htmlBody && htmlBody.length <= 1000 ? htmlBody : null),
        date: date ? new Date(date) : new Date(parseInt(message.internalDate)),
        unread: isUnread,
        starred: isStarred,
        isReplied,
        inReplyTo,
        references,
        hasAttachments,
        attachmentsData,
        messageId: messageIdHeader,
      },
    });
  }

  private extractBodies(payload: any): { textBody: string; htmlBody: string } {
    let textBody = '';
    let htmlBody = '';

    const extractFromPart = (part: any) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }

      if (part.parts) {
        part.parts.forEach(extractFromPart);
      }
    };

    if (payload.body?.data) {
      if (payload.mimeType === 'text/plain') {
        textBody = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      } else if (payload.mimeType === 'text/html') {
        htmlBody = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }
    }

    if (payload.parts) {
      payload.parts.forEach(extractFromPart);
    }

    return { textBody, htmlBody };
  }

  private async extractAttachments(gmail: any, message: any, accountId: string, messageId: string): Promise<any[]> {
    const attachments = [];

    const extractFromPart = async (part: any) => {
      if (part.filename && part.body?.attachmentId) {
        try {
          const attachment = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: message.id,
            id: part.body.attachmentId,
          });

          const data = Buffer.from(attachment.data.data, 'base64');
          
          const key = await this.emailStorageService.uploadAttachment(
            accountId,
            messageId,
            part.body.attachmentId,
            data,
            part.mimeType || 'application/octet-stream',
            part.filename
          );

          attachments.push({
            id: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            key,
          });
        } catch (error) {
          this.logger.error(`Failed to download attachment ${part.filename}:`, error.message);
        }
      }

      if (part.parts) {
        for (const subPart of part.parts) {
          await extractFromPart(subPart);
        }
      }
    };

    if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        await extractFromPart(part);
      }
    }

    return attachments;
  }

  private getFolderFromLabels(labels: string[]): string {
    if (labels.includes('INBOX')) return 'inbox';
    if (labels.includes('SENT')) return 'sent';
    if (labels.includes('DRAFT')) return 'draft';
    if (labels.includes('SPAM')) return 'spam';
    if (labels.includes('TRASH')) return 'trash';
    return 'other';
  }

  private parseEmailList(emailString: string): any {
    if (!emailString) return [];
    
    const emails = emailString.split(',').map(e => e.trim());
    return emails.map(email => {
      const match = email.match(/(.+?)\s*<(.+?)>/) || email.match(/(.+)/);
      if (match) {
        return {
          name: match[1]?.trim() || '',
          email: match[2]?.trim() || match[1]?.trim() || '',
        };
      }
      return { name: '', email: email.trim() };
    });
  }

  private extractName(fromHeader: string): string {
    const match = fromHeader.match(/(.+?)\s*<.+?>/) || fromHeader.match(/(.+)/);
    return match ? match[1].trim().replace(/"/g, '') : '';
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async autoSyncEmails() {
    this.logger.log('Starting automatic email sync for all accounts...');
    
    try {
      const accounts = await this.prisma.emailAccount.findMany({
        where: {
          provider: 'google',
          status: 'connected',
          syncEmail: true,
          refreshToken: { not: null },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Found ${accounts.length} accounts with email sync enabled`);

      for (const account of accounts) {
        try {
          this.logger.log(`Syncing emails for account ${account.email} (${account.id})`);
          await this.syncEmailsForAccount(account.user.id, account.id);
        } catch (error) {
          this.logger.error(
            `Failed to auto-sync emails for account ${account.email}:`,
            error.message,
          );
        }
      }

      this.logger.log('Automatic email sync completed');
    } catch (error) {
      this.logger.error('Error in automatic email sync:', error.message);
    }
  }

  async discoverEmailDateRange(userId: string, accountId: string): Promise<{
    oldestEmailDate: Date | null;
    newestEmailDate: Date | null;
    estimatedTotalMessages: number;
  }> {
    this.logger.log(`Starting discovery for account ${accountId}`);
    
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const accessToken = await this.googleAuthService.getAccessToken(userId, accountId);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const profile = await gmail.users.getProfile({ userId: 'me' });
    const totalMessages = profile.data.messagesTotal || 0;
    this.logger.log(`Account has ${totalMessages} total messages`);

    let oldestEmailDate: Date | null = null;
    let newestEmailDate: Date | null = null;

    if (totalMessages > 0) {
      try {
        const newestResponse = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 1,
        });

        if (newestResponse.data.messages && newestResponse.data.messages.length > 0) {
          const newestMessageId = newestResponse.data.messages[0].id;
          const newestMessage = await gmail.users.messages.get({
            userId: 'me',
            id: newestMessageId,
            format: 'metadata',
            metadataHeaders: ['Date'],
          });
          
          const dateHeader = newestMessage.data.payload?.headers?.find(
            (h: any) => h.name?.toLowerCase() === 'date'
          );
          
          if (dateHeader?.value) {
            newestEmailDate = new Date(dateHeader.value);
          }
        }
      } catch (error) {
        this.logger.error('Error fetching newest email:', error.message);
      }

      try {
        let currentYear = 1990;
        const currentYearNow = new Date().getFullYear();
        let foundOldest = false;

        while (currentYear <= currentYearNow && !foundOldest) {
          const oldestResponse = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10,
            q: `before:${currentYear + 1}/01/01`,
          });

          if (oldestResponse.data.messages && oldestResponse.data.messages.length > 0) {
            const messages = oldestResponse.data.messages;
            const lastMessageId = messages[messages.length - 1].id;
            
            const oldestMessage = await gmail.users.messages.get({
              userId: 'me',
              id: lastMessageId,
              format: 'metadata',
              metadataHeaders: ['Date'],
            });
            
            const dateHeader = oldestMessage.data.payload?.headers?.find(
              (h: any) => h.name?.toLowerCase() === 'date'
            );
            
            if (dateHeader?.value) {
              oldestEmailDate = new Date(dateHeader.value);
              this.logger.log(`Found oldest email from year ${currentYear}: ${oldestEmailDate.toISOString()}`);
              foundOldest = true;
            }
            break;
          }

          currentYear += 5;
        }

        if (!foundOldest) {
          this.logger.warn('Could not find oldest email, using current date as fallback');
          oldestEmailDate = new Date();
        }
      } catch (error) {
        this.logger.error('Error fetching oldest email:', error.message);
        oldestEmailDate = new Date();
      }
    }

    await this.prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        detectedOldestEmailDate: oldestEmailDate,
        detectedNewestEmailDate: newestEmailDate,
        estimatedTotalMessages: totalMessages,
        totalMessagesInGmail: totalMessages,
      },
    });

    this.logger.log(`Discovery complete: ${oldestEmailDate?.toISOString()} to ${newestEmailDate?.toISOString()}, ${totalMessages} messages`);

    return {
      oldestEmailDate,
      newestEmailDate,
      estimatedTotalMessages: totalMessages,
    };
  }

  async updateSyncSettings(userId: string, accountId: string, syncFromDate: Date): Promise<void> {
    this.logger.log(`Updating sync settings for account ${accountId}: syncFromDate=${syncFromDate.toISOString()}`);
    
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const oldSyncFromDate = account.syncFromDate;
    
    if (oldSyncFromDate && syncFromDate > oldSyncFromDate) {
      this.logger.log(`Detected date range reduction (${oldSyncFromDate.toISOString()} -> ${syncFromDate.toISOString()}), cleaning up old messages`);
      await this.cleanupOldMessages(accountId, syncFromDate);
    }

    await this.prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        syncFromDate,
        pendingInitialSync: false,
      },
    });

    this.logger.log(`Sync settings updated for account ${accountId}`);
  }

  private async cleanupOldMessages(accountId: string, newSyncFromDate: Date): Promise<void> {
    this.logger.log(`Starting cleanup of messages before ${newSyncFromDate.toISOString()} for account ${accountId}`);
    
    const messagesToDelete = await this.prisma.emailMessage.findMany({
      where: {
        accountId,
        date: {
          lt: newSyncFromDate,
        },
      },
      select: {
        id: true,
        htmlBodyKey: true,
        attachmentKeys: true,
      },
    });

    if (messagesToDelete.length === 0) {
      this.logger.log('No messages to cleanup');
      return;
    }

    this.logger.log(`Found ${messagesToDelete.length} messages to delete`);

    const keysToDelete: string[] = [];
    
    for (const message of messagesToDelete) {
      if (message.htmlBodyKey) {
        keysToDelete.push(message.htmlBodyKey);
      }
      
      if (message.attachmentKeys && Array.isArray(message.attachmentKeys)) {
        const attachmentKeys = message.attachmentKeys as any[];
        for (const attachment of attachmentKeys) {
          if (attachment.key) {
            keysToDelete.push(attachment.key);
          }
        }
      }
    }

    if (keysToDelete.length > 0) {
      this.logger.log(`Deleting ${keysToDelete.length} files from Backblaze`);
      try {
        await this.emailStorageService.deleteFiles(keysToDelete);
      } catch (error) {
        this.logger.error(`Failed to delete files from Backblaze, aborting database cleanup:`, error);
        throw new Error(`Cleanup aborted: Failed to delete ${keysToDelete.length} files from storage. Database not modified.`);
      }
    }

    const messageIds = messagesToDelete.map(m => m.id);
    
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.emailMessage.deleteMany({
          where: {
            id: { in: messageIds },
          },
        });

        const remainingCount = await tx.emailMessage.count({
          where: { accountId },
        });

        await tx.emailAccount.update({
          where: { id: accountId },
          data: {
            syncedMessagesCount: remainingCount,
          },
        });

        this.logger.log(`Cleanup complete: deleted ${messagesToDelete.length} messages, ${keysToDelete.length} files. Remaining: ${remainingCount} messages`);
      });
    } catch (error) {
      this.logger.error(`Failed to cleanup database records:`, error);
      throw new Error(`Database cleanup failed after storage deletion. Manual intervention may be required.`);
    }
  }

  private formatDateForGmailQuery(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
}
