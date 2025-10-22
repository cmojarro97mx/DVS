import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { GoogleCalendarService } from './google-calendar.service';

@Controller('google-calendar')
@UseGuards(JwtAuthGuard)
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @Get('calendars')
  async listCalendars(@Request() req, @Query('accountId') accountId?: string) {
    return this.googleCalendarService.listCalendars(req.user.userId, accountId);
  }

  @Get('events')
  async listEvents(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('calendarId') calendarId?: string,
    @Query('maxResults') maxResults?: string,
  ) {
    return this.googleCalendarService.listEvents(
      req.user.userId,
      accountId,
      calendarId || 'primary',
      maxResults ? parseInt(maxResults) : 100,
    );
  }

  @Get('events/:eventId')
  async getEvent(
    @Request() req,
    @Param('eventId') eventId: string,
    @Query('accountId') accountId?: string,
    @Query('calendarId') calendarId?: string,
  ) {
    return this.googleCalendarService.getEvent(
      req.user.userId,
      eventId,
      accountId,
      calendarId || 'primary',
    );
  }

  @Post('events')
  async createEvent(
    @Request() req,
    @Body() eventData: any,
    @Query('accountId') accountId?: string,
    @Query('calendarId') calendarId?: string,
  ) {
    return this.googleCalendarService.createEvent(
      req.user.userId,
      eventData,
      accountId,
      calendarId || 'primary',
    );
  }

  @Put('events/:eventId')
  async updateEvent(
    @Request() req,
    @Param('eventId') eventId: string,
    @Body() eventData: any,
    @Query('accountId') accountId?: string,
    @Query('calendarId') calendarId?: string,
  ) {
    return this.googleCalendarService.updateEvent(
      req.user.userId,
      eventId,
      eventData,
      accountId,
      calendarId || 'primary',
    );
  }

  @Delete('events/:eventId')
  async deleteEvent(
    @Request() req,
    @Param('eventId') eventId: string,
    @Query('accountId') accountId?: string,
    @Query('calendarId') calendarId?: string,
  ) {
    return this.googleCalendarService.deleteEvent(
      req.user.userId,
      eventId,
      accountId,
      calendarId || 'primary',
    );
  }

  @Post('sync-events')
  async syncEvents(
    @Request() req,
    @Body() data: { events: any[]; accountId?: string; calendarId?: string },
  ) {
    return this.googleCalendarService.syncEventsToCalendar(
      req.user.userId,
      data.events,
      data.accountId,
      data.calendarId || 'primary',
    );
  }

  @Post('sync-from-google')
  async syncFromGoogle(@Request() req, @Body() data: { accountId: string }) {
    return this.googleCalendarService.syncGoogleCalendarEvents(req.user.userId, data.accountId);
  }

  @Post('sync-to-google/:eventId')
  async syncToGoogle(@Request() req, @Param('eventId') eventId: string) {
    return this.googleCalendarService.syncLocalEventToGoogle(eventId, req.user.userId);
  }
}
