import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll(@Request() req) {
    return this.employeesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.employeesService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() createEmployeeDto: any, @Request() req) {
    return this.employeesService.create(createEmployeeDto, req.user.organizationId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: any, @Request() req) {
    return this.employeesService.update(id, updateEmployeeDto, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.employeesService.remove(id, req.user.organizationId);
  }
}
