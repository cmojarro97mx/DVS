import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(@Request() req) {
    return this.expensesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.expensesService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() createData: any, @Request() req) {
    return this.expensesService.create(createData, req.user.organizationId, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Request() req) {
    return this.expensesService.update(id, updateData, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.expensesService.remove(id, req.user.organizationId);
  }
}
