import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(operationId?: string) {
    return this.prisma.task.findMany({
      where: {
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

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
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

  async create(data: any) {
    const { assignees, ...taskData } = data;

    const task = await this.prisma.task.create({
      data: taskData,
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
    }

    return this.findOne(task.id);
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const { assignees, ...taskData } = data;

    const task = await this.prisma.task.update({
      where: { id },
      data: taskData,
    });

    if (assignees !== undefined) {
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
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.prisma.task.delete({ where: { id } });
  }
}
