import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleAuthService } from '../google-auth/google-auth.service';

@Injectable()
export class GoogleCalendarService {
  constructor(private googleAuthService: GoogleAuthService) {}

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
}
