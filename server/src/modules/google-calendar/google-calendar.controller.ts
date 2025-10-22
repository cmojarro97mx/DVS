import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { GoogleCalendarService } from './google-calendar.service';

@Controller('google-calendar')
@UseGuards(JwtAuthGuard)
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @Get('calendars')
  async listCalendars(@Request() req) {
    return this.googleCalendarService.listCalendars(req.user.userId);
  }

  @Get('events')
  async listEvents(
    @Request() req,
    @Query('calendarId') calendarId?: string,
    @Query('maxResults') maxResults?: string,
  ) {
    return this.googleCalendarService.listEvents(
      req.user.userId,
      calendarId || 'primary',
      maxResults ? parseInt(maxResults) : 100,
    );
  }

  @Get('events/:eventId')
  async getEvent(
    @Request() req,
    @Param('eventId') eventId: string,
    @Query('calendarId') calendarId?: string,
  ) {
    return this.googleCalendarService.getEvent(
      req.user.userId,
      eventId,
      calendarId || 'primary',
    );
  }

  @Post('events')
  async createEvent(
    @Request() req,
    @Body() eventData: any,
    @Query('calendarId') calendarId?: string,
  ) {
    return this.googleCalendarService.createEvent(
      req.user.userId,
      eventData,
      calendarId || 'primary',
    );
  }

  @Put('events/:eventId')
  async updateEvent(
    @Request() req,
    @Param('eventId') eventId: string,
    @Body() eventData: any,
    @Query('calendarId') calendarId?: string,
  ) {
    return this.googleCalendarService.updateEvent(
      req.user.userId,
      eventId,
      eventData,
      calendarId || 'primary',
    );
  }

  @Delete('events/:eventId')
  async deleteEvent(
    @Request() req,
    @Param('eventId') eventId: string,
    @Query('calendarId') calendarId?: string,
  ) {
    return this.googleCalendarService.deleteEvent(
      req.user.userId,
      eventId,
      calendarId || 'primary',
    );
  }

  @Post('sync-events')
  async syncEvents(
    @Request() req,
    @Body() data: { events: any[]; calendarId?: string },
  ) {
    return this.googleCalendarService.syncEventsToCalendar(
      req.user.userId,
      data.events,
      data.calendarId || 'primary',
    );
  }

  @Post('sync-from-google')
  async syncFromGoogle(@Request() req) {
    return this.googleCalendarService.syncGoogleCalendarEvents(req.user.userId);
  }
}
