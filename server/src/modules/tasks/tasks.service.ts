import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { randomUUID } from 'crypto';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(organizationId: string, operationId?: string) {
    return this.prisma.tasks.findMany({
      where: {
        organizationId,
        ...(operationId && { operationId }),
      },
      include: {
        task_assignees: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const task = await this.prisma.tasks.findFirst({
      where: { 
        id,
        organizationId,
      },
      include: {
        task_assignees: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async create(data: any, organizationId: string) {
    const { assignees, ...taskData } = data;

    const cleanedData: any = {
      title: taskData.title,
      priority: taskData.priority || 'Medium',
      status: taskData.status || 'To Do',
      organizationId,
      createdBy: 'user' as const,
      lastModifiedBy: 'user' as const,
    };

    if (taskData.description) cleanedData.description = taskData.description;
    if (taskData.dueDate) cleanedData.dueDate = new Date(taskData.dueDate);
    if (taskData.operationId) cleanedData.operationId = taskData.operationId;

    const task = await this.prisma.tasks.create({
      data: cleanedData,
    });

    if (assignees && assignees.length > 0) {
      const validAssignees = [];
      for (const assigneeId of assignees) {
        let userId = assigneeId;
        let userExists = await this.prisma.users.findUnique({
          where: { id: assigneeId },
        });
        
        if (!userExists) {
          const employee = await this.prisma.employees.findUnique({
            where: { id: assigneeId },
          });
          if (employee && employee.userId) {
            userId = employee.userId;
            userExists = await this.prisma.users.findUnique({
              where: { id: userId },
            });
          }
        }
        
        if (userExists) {
          await this.prisma.task_assignees.create({
            data: {
              id: randomUUID(),
              tasks: { connect: { id: task.id } },
              users: { connect: { id: userId } },
            },
          });
          validAssignees.push(userId);
        }
      }

      if (validAssignees.length > 0) {
        await this.notificationsService.sendNotificationToUsers(validAssignees, {
          title: 'Nueva tarea asignada',
          body: `Se te ha asignado la tarea: ${task.title}`,
          url: `/tasks/${task.id}`,
          data: { type: 'task_assigned', taskId: task.id },
        });
      }
    }

    return this.findOne(task.id, organizationId);
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await this.prisma.tasks.findFirst({ 
      where: { 
        id,
        organizationId,
      },
      include: {
        task_assignees: true,
      },
    });
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const { assignees, organizationId: _, ...taskData } = data;

    const cleanedData: any = {
      lastModifiedBy: 'user' as const,
    };
    
    if (taskData.title !== undefined) cleanedData.title = taskData.title;
    if (taskData.priority !== undefined) cleanedData.priority = taskData.priority;
    if (taskData.status !== undefined) cleanedData.status = taskData.status;
    if (taskData.description !== undefined) cleanedData.description = taskData.description || null;
    if (taskData.dueDate !== undefined) cleanedData.dueDate = taskData.dueDate ? new Date(taskData.dueDate) : null;

    if (taskData.status !== undefined && taskData.status !== 'Done' && existing.status === 'Done') {
      cleanedData.overdueNotificationSent = false;
    }

    if (taskData.dueDate !== undefined) {
      const newDueDate = taskData.dueDate ? new Date(taskData.dueDate) : null;
      
      if (newDueDate === null) {
        cleanedData.overdueNotificationSent = false;
      } else if (existing.dueDate && newDueDate > existing.dueDate) {
        cleanedData.overdueNotificationSent = false;
      } else if (!existing.dueDate && existing.overdueNotificationSent) {
        cleanedData.overdueNotificationSent = false;
      }
    }

    const task = await this.prisma.tasks.update({
      where: { id },
      data: cleanedData,
    });

    if (assignees !== undefined) {
      const oldAssigneeIds = existing.task_assignees.map(a => a.userId);
      
      await this.prisma.task_assignees.deleteMany({
        where: { taskId: id },
      });

      if (assignees.length > 0) {
        const validUserIds = [];
        for (const assigneeId of assignees) {
          let userId = assigneeId;
          let userExists = await this.prisma.users.findUnique({
            where: { id: assigneeId },
          });
          
          if (!userExists) {
            const employee = await this.prisma.employees.findUnique({
              where: { id: assigneeId },
            });
            if (employee && employee.userId) {
              userId = employee.userId;
              userExists = await this.prisma.users.findUnique({
                where: { id: userId },
              });
            }
          }
          
          if (userExists) {
            await this.prisma.task_assignees.create({
              data: {
                id: randomUUID(),
                tasks: { connect: { id: id } },
                users: { connect: { id: userId } },
              },
            });
            validUserIds.push(userId);
          }
        }

        const addedAssignees = validUserIds.filter(id => !oldAssigneeIds.includes(id));
        if (addedAssignees.length > 0) {
          await this.notificationsService.sendNotificationToUsers(addedAssignees, {
            title: 'Nueva tarea asignada',
            body: `Se te ha asignado la tarea: ${task.title}`,
            url: `/tasks/${task.id}`,
            data: { type: 'task_assigned', taskId: task.id },
          });
        }
      }
    }

    if (taskData.status === 'Done') {
      const assigneeIds = assignees || existing.task_assignees.map(a => a.userId);
      if (assigneeIds.length > 0) {
        await this.notificationsService.sendNotificationToUsers(assigneeIds, {
          title: 'Tarea completada',
          body: `La tarea "${task.title}" ha sido completada`,
          url: `/tasks/${task.id}`,
          data: { type: 'task_completed', taskId: task.id },
        });
      }
    }

    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.tasks.findFirst({ 
      where: { 
        id,
        organizationId,
      } 
    });
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.prisma.tasks.delete({ where: { id } });
  }
}
