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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarService.findOne(id);
  }

  @Post()
  create(@Body() createData: any) {
    return this.calendarService.create(createData);
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
