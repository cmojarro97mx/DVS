import { Controller, Get, Post, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
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
    try {
      return await this.taskAutomationService.toggleAutomation(req.user.organizationId);
    } catch (error) {
      if (error.message === 'NO_EMAIL_ACCOUNTS') {
        throw new HttpException(
          'Debes tener al menos una cuenta de correo vinculada para activar la automatización de tareas. Ve a la configuración de Email y vincula una cuenta primero.',
          HttpStatus.BAD_REQUEST
        );
      }
      throw error;
    }
  }

  @Post('process-now')
  async processNow(@Request() req) {
    await this.taskAutomationService.processEmailsForTasks();
    return { success: true, message: 'Procesamiento iniciado' };
  }
}
