import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { TaskAutomationService } from './task-automation.service';

@Controller('task-automation')
@UseGuards(JwtAuthGuard)
export class TaskAutomationController {
  constructor(private readonly taskAutomationService: TaskAutomationService) {}

  @Get('config')
  async getConfig(@Request() req) {
    const automation = await this.taskAutomationService.getAutomation(
      req.user.organizationId
    );
    return automation || { enabled: false, tasksCreated: 0, tasksUpdated: 0 };
  }

  @Post('toggle')
  async toggle(@Request() req) {
    return this.taskAutomationService.toggleAutomation(req.user.organizationId);
  }

  @Post('process-now')
  async processNow(@Request() req) {
    await this.taskAutomationService.processEmailsForTasks();
    return { success: true, message: 'Procesamiento iniciado' };
  }
}
