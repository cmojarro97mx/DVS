import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(@Request() req) {
    return this.invoicesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() createData: any, @Request() req) {
    return this.invoicesService.create(createData, req.user.organizationId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Request() req) {
    return this.invoicesService.update(id, updateData, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.invoicesService.remove(id, req.user.organizationId);
  }
}
