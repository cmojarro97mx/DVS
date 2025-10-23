import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller('automations')
@UseGuards(JwtAuthGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  findAll(@Request() req) {
    return this.automationsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.automationsService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() data: any, @Request() req) {
    return this.automationsService.create(data, req.user.organizationId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.automationsService.update(id, data, req.user.organizationId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.automationsService.delete(id, req.user.organizationId);
  }

  @Post(':id/toggle')
  toggleEnabled(@Param('id') id: string, @Request() req) {
    return this.automationsService.toggleEnabled(id, req.user.organizationId);
  }
}
