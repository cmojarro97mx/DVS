import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { SystemEmployeeService } from './system-employee.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, SystemEmployeeService, PrismaService],
  exports: [EmployeesService, SystemEmployeeService],
})
export class EmployeesModule {}
