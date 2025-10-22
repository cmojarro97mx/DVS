import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CalendarService } from './calendar.service';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  findAll(
    @Request() req, 
    @Query('emailAccountIds') emailAccountIds?: string,
    @Query('includeLocal') includeLocal?: string,
    @Query('status') status?: string
  ) {
    const user = req.user as any;
    const accountIdsArray = emailAccountIds ? emailAccountIds.split(',') : [];
    const includeLocalBool = includeLocal === 'true';
    return this.calendarService.findAll(user.userId, user.organizationId, {
      emailAccountIds: accountIdsArray,
      includeLocal: includeLocalBool,
      status,
    });
  }

  @Get('stats')
  getStats(
    @Request() req,
    @Query('accountId') accountId?: string
  ) {
    const user = req.user as any;
    return this.calendarService.getEventStats(user.userId, user.organizationId, accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarService.findOne(id);
  }

  @Post()
  create(@Request() req, @Body() createData: any) {
    const user = req.user as any;
    return this.calendarService.create({
      ...createData,
      userId: user.userId,
      organizationId: user.organizationId,
    });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.calendarService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarService.remove(id);
  }
}
