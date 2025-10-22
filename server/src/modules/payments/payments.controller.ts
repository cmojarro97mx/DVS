import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Request() req) {
    return this.paymentsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.paymentsService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() createData: any, @Request() req) {
    return this.paymentsService.create(createData, req.user.organizationId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Request() req) {
    return this.paymentsService.update(id, updateData, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.paymentsService.remove(id, req.user.organizationId);
  }
}
