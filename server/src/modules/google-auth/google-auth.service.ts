import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../common/prisma.service';
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

    // Clean up expired states every 5 minutes
    setInterval(() => this.cleanupExpiredStates(), 5 * 60 * 1000);
  }

  private getCallbackUrl(): string {
    const domain = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : 'http://localhost:3001';
    return `${domain}/api/google-auth/callback`;
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

    // Consume the state (one-time use)
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
  }

  async handleCallback(code: string, state: string): Promise<void> {
    // Validate state and get userId
    const userId = this.validateState(state);

    const { tokens } = await this.oauth2Client.getToken(code);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });
  }

  async getConnectionStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    return {
      connected: !!user?.googleAccessToken,
      hasRefreshToken: !!user?.googleRefreshToken,
      tokenExpiry: user?.googleTokenExpiry,
    };
  }

  async disconnect(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
      },
    });
  }

  async getAccessToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!user?.googleAccessToken) {
      throw new Error('User not connected to Google');
    }

    if (user.googleTokenExpiry && new Date() >= user.googleTokenExpiry) {
      if (!user.googleRefreshToken) {
        throw new Error('Refresh token not available');
      }

      this.oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: credentials.access_token,
          googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        },
      });

      return credentials.access_token;
    }

    return user.googleAccessToken;
  }
}
