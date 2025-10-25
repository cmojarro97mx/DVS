import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../common/prisma.service';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';

interface OAuthState {
  userId: string;
  createdAt: Date;
}

@Injectable()
export class GoogleAuthService {
  private oauth2Client;
  private oauthStates: Map<string, OAuthState> = new Map();
  private readonly STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.getCallbackUrl(),
    );

    setInterval(() => this.cleanupExpiredStates(), 5 * 60 * 1000);
  }

  private getCallbackUrl(): string {
    const domain = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPL_SLUG 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : 'http://localhost:3001';
    
    if (process.env.GOOGLE_REDIRECT_URI) {
      const redirectUri = process.env.GOOGLE_REDIRECT_URI.trim();
      if (redirectUri.startsWith('http://') || redirectUri.startsWith('https://')) {
        return redirectUri;
      }
      if (redirectUri.startsWith('/')) {
        return `${domain}${redirectUri}`;
      }
      return redirectUri;
    }
    
    return `${domain}/api/google-auth/callback`;
  }

  getCallbackUrlPublic(): string {
    return this.getCallbackUrl();
  }

  private generateSecureState(userId: string): string {
    const nonce = crypto.randomBytes(32).toString('hex');
    this.oauthStates.set(nonce, {
      userId,
      createdAt: new Date(),
    });
    return nonce;
  }

  private validateState(state: string): string {
    const stateData = this.oauthStates.get(state);
    
    if (!stateData) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const now = new Date();
    const elapsed = now.getTime() - stateData.createdAt.getTime();
    
    if (elapsed > this.STATE_EXPIRY_MS) {
      this.oauthStates.delete(state);
      throw new UnauthorizedException('OAuth state expired');
    }

    this.oauthStates.delete(state);
    
    return stateData.userId;
  }

  private cleanupExpiredStates(): void {
    const now = new Date();
    for (const [nonce, stateData] of this.oauthStates.entries()) {
      const elapsed = now.getTime() - stateData.createdAt.getTime();
      if (elapsed > this.STATE_EXPIRY_MS) {
        this.oauthStates.delete(nonce);
      }
    }
  }

  async getAuthorizationUrl(userId: string): Promise<string> {
    try {
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ];

      const secureState = this.generateSecureState(userId);

      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: secureState,
        prompt: 'consent',
      });

      return authUrl;
    } catch (error) {
      console.error('Error in getAuthorizationUrl:', error);
      throw error;
    }
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const userId = this.validateState(state);

    const { tokens } = await this.oauth2Client.getToken(code);
    
    this.oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    console.log(`[GoogleAuth] OAuth callback for userId: ${userId}`);
    console.log(`[GoogleAuth] Email obtained from Google: ${email}`);

    if (!email) {
      console.error('[GoogleAuth] Failed to retrieve email from Google OAuth');
      throw new Error('Could not retrieve email from Google');
    }

    const existingAccount = await this.prisma.email_accounts.findFirst({
      where: {
        userId,
        email,
        provider: 'google',
      },
    });

    if (existingAccount) {
      console.log(`[GoogleAuth] Updating existing account: ${existingAccount.id} with email: ${email}`);
      await this.prisma.email_accounts.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingAccount.refreshToken,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          status: 'connected',
        },
      });
    } else {
      console.log(`[GoogleAuth] Creating new EmailAccount for userId: ${userId} with email: ${email}`);
      await this.prisma.email_accounts.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
          users: { connect: { id: userId } },
          email,
          provider: 'google',
          status: 'connected',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          syncEmail: false,
          syncCalendar: false,
        },
      });
      console.log(`[GoogleAuth] Successfully created EmailAccount with email: ${email}`);
    }
  }

  async getConnectionStatus(userId: string) {
    const accounts = await this.prisma.email_accounts.findMany({
      where: {
        userId,
        provider: 'google',
      },
      select: {
        id: true,
        email: true,
        status: true,
        syncEmail: true,
        syncCalendar: true,
        tokenExpiry: true,
        lastEmailSync: true,
        lastCalendarSync: true,
      },
    });

    return {
      connected: accounts.length > 0,
      accounts: accounts.map(account => ({
        id: account.id,
        email: account.email,
        status: account.status,
        gmailSyncEnabled: account.syncEmail,
        calendarSyncEnabled: account.syncCalendar,
        tokenExpiry: account.tokenExpiry,
        lastGmailSync: account.lastEmailSync,
        lastCalendarSync: account.lastCalendarSync,
      })),
    };
  }

  async disconnect(userId: string, accountId: string): Promise<{ eventsDeleted: number }> {
    const account = await this.prisma.email_accounts.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    const eventsCount = await this.prisma.events.count({
      where: { emailAccountId: accountId },
    });

    await this.prisma.email_accounts.delete({
      where: { id: accountId },
    });

    console.log(`[GoogleAuth] Disconnected account ${account.email}, deleted ${eventsCount} associated calendar events`);

    return { eventsDeleted: eventsCount };
  }

  async enableGmailSync(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.email_accounts.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    await this.prisma.email_accounts.update({
      where: { id: accountId },
      data: {
        syncEmail: true,
      },
    });
  }

  async disableGmailSync(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.email_accounts.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    await this.prisma.email_accounts.update({
      where: { id: accountId },
      data: {
        syncEmail: false,
      },
    });
  }

  async enableCalendarSync(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.email_accounts.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    await this.prisma.email_accounts.update({
      where: { id: accountId },
      data: {
        syncCalendar: true,
      },
    });
  }

  async disableCalendarSync(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.email_accounts.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    await this.prisma.email_accounts.update({
      where: { id: accountId },
      data: {
        syncCalendar: false,
      },
    });
  }

  async getAccessToken(userId: string, accountId?: string): Promise<string> {
    let account;
    
    if (accountId) {
      account = await this.prisma.email_accounts.findFirst({
        where: {
          id: accountId,
          userId,
        },
      });
    } else {
      account = await this.prisma.email_accounts.findFirst({
        where: {
          userId,
          provider: 'google',
          status: 'connected',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (!account?.accessToken) {
      throw new Error('User not connected to Google');
    }

    if (account.tokenExpiry && new Date() >= account.tokenExpiry) {
      if (!account.refreshToken) {
        throw new Error('Refresh token not available');
      }

      this.oauth2Client.setCredentials({
        refresh_token: account.refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      await this.prisma.email_accounts.update({
        where: { id: account.id },
        data: {
          accessToken: credentials.access_token,
          tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        },
      });

      return credentials.access_token;
    }

    return account.accessToken;
  }

  async getEmailAccountById(accountId: string) {
    return this.prisma.email_accounts.findUnique({
      where: { id: accountId },
    });
  }

  async updateLastSync(accountId: string, type: 'email' | 'calendar') {
    const updateData = type === 'email' 
      ? { lastEmailSync: new Date() }
      : { lastCalendarSync: new Date() };

    await this.prisma.email_accounts.update({
      where: { id: accountId },
      data: updateData,
    });
  }
}
