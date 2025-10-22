import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { google } from 'googleapis';
import { GoogleAuthService } from '../google-auth/google-auth.service';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private googleAuthService: GoogleAuthService,
    private prisma: PrismaService,
  ) {}

  private async getCalendarClient(userId: string, accountId?: string) {
    const accessToken = await this.googleAuthService.getAccessToken(userId, accountId);
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async listCalendars(userId: string, accountId?: string) {
    const calendar = await this.getCalendarClient(userId, accountId);
    
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  }

  async listEvents(userId: string, accountId?: string, calendarId: string = 'primary', maxResults: number = 100) {
    const calendar = await this.getCalendarClient(userId, accountId);
    
    const response = await calendar.events.list({
      calendarId,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: new Date().toISOString(),
    });
    
    return response.data.items || [];
  }

  async getEvent(userId: string, eventId: string, accountId?: string, calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId, accountId);
    
    const response = await calendar.events.get({
      calendarId,
      eventId,
    });
    
    return response.data;
  }

  async createEvent(userId: string, eventData: any, accountId?: string, calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId, accountId);
    
    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventData,
    });
    
    return response.data;
  }

  async updateEvent(userId: string, eventId: string, eventData: any, accountId?: string, calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId, accountId);
    
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: eventData,
    });
    
    return response.data;
  }

  async deleteEvent(userId: string, eventId: string, accountId?: string, calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId, accountId);
    
    await calendar.events.delete({
      calendarId,
      eventId,
    });
    
    return { success: true };
  }

  async syncEventsToCalendar(userId: string, events: any[], accountId?: string, calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId, accountId);
    const results = [];

    for (const event of events) {
      try {
        const response = await calendar.events.insert({
          calendarId,
          requestBody: event,
        });
        results.push({ success: true, event: response.data });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  async syncGoogleCalendarEvents(userId: string, accountId: string) {
    try {
      const account = await this.prisma.emailAccount.findFirst({
        where: { 
          id: accountId,
          userId,
          syncCalendar: true,
        },
        include: {
          user: {
            select: {
              organizationId: true,
            },
          },
        },
      });

      if (!account) {
        return { success: false, message: 'Calendar sync is not enabled for this account' };
      }

      const calendar = await this.getCalendarClient(userId, accountId);
      
      const timeMin = new Date();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 60);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100,
      });

      const googleEvents = response.data.items || [];
      let created = 0;
      let updated = 0;

      for (const gEvent of googleEvents) {
        if (!gEvent.id || !gEvent.start) {
          this.logger.warn(`Skipping event without ID or start date for account ${accountId}`);
          continue;
        }

        const startDate = new Date(gEvent.start.dateTime || gEvent.start.date);
        const endDate = new Date(gEvent.end?.dateTime || gEvent.end?.date || startDate);

        const eventData = {
          title: gEvent.summary || 'Sin título',
          description: gEvent.description || null,
          startDate,
          endDate,
          location: gEvent.location || null,
          attendees: gEvent.attendees ? JSON.parse(JSON.stringify(gEvent.attendees)) : null,
          allDay: !!gEvent.start.date,
          source: 'google',
          googleEventId: gEvent.id,
          googleCalendarId: 'primary',
          userId,
          organizationId: account.user.organizationId,
        };

        const existingEvent = await this.prisma.event.findFirst({
          where: { 
            userId,
            googleEventId: gEvent.id,
            organizationId: account.user.organizationId,
          },
        });

        if (existingEvent) {
          if (existingEvent.userId === userId && existingEvent.organizationId === account.user.organizationId) {
            await this.prisma.event.update({
              where: { id: existingEvent.id },
              data: eventData,
            });
            updated++;
          } else {
            this.logger.error(`Security violation: Event ${existingEvent.id} ownership mismatch for user ${userId}`);
          }
        } else {
          await this.prisma.event.create({
            data: eventData,
          });
          created++;
        }
      }

      await this.googleAuthService.updateLastSync(accountId, 'calendar');

      return {
        success: true,
        created,
        updated,
        total: googleEvents.length,
        message: `Sync completed: ${created} created, ${updated} updated`,
      };
    } catch (error) {
      console.error('Error syncing Google Calendar events:', error);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoSyncCalendars() {
    this.logger.log('Starting automatic calendar sync for all accounts...');
    
    try {
      const accounts = await this.prisma.emailAccount.findMany({
        where: {
          provider: 'google',
          status: 'connected',
          syncCalendar: true,
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

      this.logger.log(`Found ${accounts.length} accounts with calendar sync enabled`);

      for (const account of accounts) {
        try {
          const result = await this.syncGoogleCalendarEvents(account.userId, account.id);
          this.logger.log(`Synced calendar for ${account.email}: ${result.created} created, ${result.updated} updated`);
        } catch (error) {
          this.logger.error(`Failed to sync calendar for ${account.email}:`, error.message);
        }
      }

      this.logger.log('Automatic calendar sync completed');
    } catch (error) {
      this.logger.error('Error in automatic calendar sync:', error);
    }
  }
}
