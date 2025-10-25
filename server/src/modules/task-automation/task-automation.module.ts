import { Module } from '@nestjs/common';
import { TaskAutomationService } from './task-automation.service';
import { TaskAutomationController } from './task-automation.controller';
import { PrismaService } from '../../common/prisma.service';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [EmployeesModule],
  controllers: [TaskAutomationController],
  providers: [TaskAutomationService, PrismaService],
  exports: [TaskAutomationService],
})
export class TaskAutomationModule {}
