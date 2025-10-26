import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.clientsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.clientsService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() createData: any, @Request() req: any) {
    return this.clientsService.create({
      ...createData,
      organizationId: req.user.organizationId,
    });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Request() req: any) {
    return this.clientsService.update(id, updateData, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.clientsService.remove(id, req.user.organizationId);
  }
}
