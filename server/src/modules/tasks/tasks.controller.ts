import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Query('operationId') operationId?: string, @Request() req?) {
    return this.tasksService.findAll(req.user.organizationId, operationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() createData: any, @Request() req) {
    return this.tasksService.create(createData, req.user.organizationId);
  }

  @Post('quick-create')
  async quickCreate(@Body() taskData: any, @Request() req) {
    return this.tasksService.quickCreateTask(taskData, req.user.organizationId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Request() req) {
    return this.tasksService.update(id, updateData, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.tasksService.remove(id, req.user.organizationId);
  }
}
