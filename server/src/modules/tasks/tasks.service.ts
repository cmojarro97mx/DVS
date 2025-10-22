import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(organizationId: string, operationId?: string) {
    return this.prisma.task.findMany({
      where: {
        organizationId,
        ...(operationId && { operationId }),
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        column: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { 
        id,
        organizationId,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        column: true,
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async create(data: any, organizationId: string) {
    const { assignees, ...taskData } = data;

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        organizationId,
      },
    });

    if (assignees && assignees.length > 0) {
      await Promise.all(
        assignees.map((userId: string) =>
          this.prisma.taskAssignee.create({
            data: {
              taskId: task.id,
              userId,
            },
          }),
        ),
      );

      await this.notificationsService.sendNotificationToUsers(assignees, {
        title: 'Nueva tarea asignada',
        body: `Se te ha asignado la tarea: ${task.title}`,
        url: `/tasks/${task.id}`,
        data: { type: 'task_assigned', taskId: task.id },
      });
    }

    return this.findOne(task.id, organizationId);
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await this.prisma.task.findFirst({ 
      where: { 
        id,
        organizationId,
      },
      include: {
        assignees: true,
      },
    });
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const { assignees, organizationId: _, ...taskData } = data;

    const task = await this.prisma.task.update({
      where: { id },
      data: taskData,
    });

    if (assignees !== undefined) {
      const oldAssigneeIds = existing.assignees.map(a => a.userId);
      
      await this.prisma.taskAssignee.deleteMany({
        where: { taskId: id },
      });

      if (assignees.length > 0) {
        await Promise.all(
          assignees.map((userId: string) =>
            this.prisma.taskAssignee.create({
              data: {
                taskId: id,
                userId,
              },
            }),
          ),
        );

        const addedAssignees = assignees.filter(id => !oldAssigneeIds.includes(id));
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

    if (taskData.status === 'completed') {
      const assigneeIds = assignees || existing.assignees.map(a => a.userId);
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
    const existing = await this.prisma.task.findFirst({ 
      where: { 
        id,
        organizationId,
      } 
    });
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.prisma.task.delete({ where: { id } });
  }
}
