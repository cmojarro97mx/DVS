import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleAuthService } from '../google-auth/google-auth.service';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class GoogleCalendarService {
  constructor(
    private googleAuthService: GoogleAuthService,
    private prisma: PrismaService,
  ) {}

  private async getCalendarClient(userId: string) {
    const accessToken = await this.googleAuthService.getAccessToken(userId);
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async listCalendars(userId: string) {
    const calendar = await this.getCalendarClient(userId);
    
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  }

  async listEvents(userId: string, calendarId: string = 'primary', maxResults: number = 100) {
    const calendar = await this.getCalendarClient(userId);
    
    const response = await calendar.events.list({
      calendarId,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: new Date().toISOString(),
    });
    
    return response.data.items || [];
  }

  async getEvent(userId: string, eventId: string, calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId);
    
    const response = await calendar.events.get({
      calendarId,
      eventId,
    });
    
    return response.data;
  }

  async createEvent(userId: string, eventData: any, calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId);
    
    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventData,
    });
    
    return response.data;
  }

  async updateEvent(userId: string, eventId: string, eventData: any, calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId);
    
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: eventData,
    });
    
    return response.data;
  }

  async deleteEvent(userId: string, eventId: string, calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId);
    
    await calendar.events.delete({
      calendarId,
      eventId,
    });
    
    return { success: true };
  }

  async syncEventsToCalendar(userId: string, events: any[], calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId);
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

  async syncGoogleCalendarEvents(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { calendarSyncEnabled: true, organizationId: true },
      });

      if (!user?.calendarSyncEnabled) {
        return { success: false, message: 'Calendar sync is not enabled' };
      }

      const calendar = await this.getCalendarClient(userId);
      
      // Obtener eventos de los próximos 60 días
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
        if (!gEvent.id || !gEvent.start) continue;

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
          organizationId: user.organizationId,
        };

        const existingEvent = await this.prisma.event.findUnique({
          where: { googleEventId: gEvent.id },
        });

        if (existingEvent) {
          await this.prisma.event.update({
            where: { id: existingEvent.id },
            data: eventData,
          });
          updated++;
        } else {
          await this.prisma.event.create({
            data: eventData,
          });
          created++;
        }
      }

      // Actualizar última sincronización
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastCalendarSync: new Date() },
      });

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
}
