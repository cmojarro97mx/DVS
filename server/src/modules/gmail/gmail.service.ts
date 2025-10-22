import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleAuthService } from '../google-auth/google-auth.service';

@Injectable()
export class GmailService {
  constructor(private googleAuthService: GoogleAuthService) {}

  private async getGmailClient(userId: string, accountId?: string) {
    const accessToken = await this.googleAuthService.getAccessToken(userId, accountId);
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async getProfile(userId: string, accountId?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    const response = await gmail.users.getProfile({ userId: 'me' });
    return response.data;
  }

  async listMessages(userId: string, accountId?: string, maxResults: number = 50, query?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query,
    });
    
    return response.data.messages || [];
  }

  async getMessage(userId: string, messageId: string, accountId?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    
    return response.data;
  }

  async sendMessage(userId: string, emailData: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
  }, accountId?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    const email = this.createEmail(emailData);
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });
    
    return response.data;
  }

  async replyToMessage(userId: string, messageId: string, replyData: {
    body: string;
    cc?: string;
    bcc?: string;
  }, accountId?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    const originalMessage = await this.getMessage(userId, messageId, accountId);
    const headers = originalMessage.payload?.headers || [];
    
    const toHeader = headers.find(h => h.name?.toLowerCase() === 'from');
    const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
    const messageIdHeader = headers.find(h => h.name?.toLowerCase() === 'message-id');
    
    const to = toHeader?.value || '';
    const subject = subjectHeader?.value?.startsWith('Re:') 
      ? subjectHeader.value 
      : `Re: ${subjectHeader?.value || ''}`;
    
    const email = this.createEmail({
      to,
      subject,
      body: replyData.body,
      cc: replyData.cc,
      bcc: replyData.bcc,
    }, {
      threadId: originalMessage.threadId,
      inReplyTo: messageIdHeader?.value,
    });
    
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId: originalMessage.threadId,
      },
    });
    
    return response.data;
  }

  async deleteMessage(userId: string, messageId: string, accountId?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    await gmail.users.messages.delete({
      userId: 'me',
      id: messageId,
    });
    
    return { success: true };
  }

  async markAsRead(userId: string, messageId: string, accountId?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
    
    return response.data;
  }

  async markAsUnread(userId: string, messageId: string, accountId?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: ['UNREAD'],
      },
    });
    
    return response.data;
  }

  async listLabels(userId: string, accountId?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    const response = await gmail.users.labels.list({ userId: 'me' });
    return response.data.labels || [];
  }

  async addLabel(userId: string, messageId: string, labelId: string, accountId?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [labelId],
      },
    });
    
    return response.data;
  }

  async removeLabel(userId: string, messageId: string, labelId: string, accountId?: string) {
    const gmail = await this.getGmailClient(userId, accountId);
    
    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: [labelId],
      },
    });
    
    return response.data;
  }

  private createEmail(emailData: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
  }, headers?: {
    threadId?: string;
    inReplyTo?: string;
  }) {
    const lines = [
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
    ];
    
    if (emailData.cc) {
      lines.push(`Cc: ${emailData.cc}`);
    }
    
    if (emailData.bcc) {
      lines.push(`Bcc: ${emailData.bcc}`);
    }
    
    if (headers?.inReplyTo) {
      lines.push(`In-Reply-To: ${headers.inReplyTo}`);
      lines.push(`References: ${headers.inReplyTo}`);
    }
    
    lines.push('Content-Type: text/html; charset=utf-8');
    lines.push('');
    lines.push(emailData.body);
    
    return lines.join('\r\n');
  }
}
