import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AssistantToolsService {
  constructor(private prisma: PrismaService) {}

  async createOperation(organizationId: string, data: any) {
    try {
      const operation = await this.prisma.operation.create({
        data: {
          organizationId,
          projectName: data.projectName,
          projectCategory: data.projectCategory,
          operationType: data.operationType,
          status: data.status || 'Planning',
          progress: data.progress || 0,
          startDate: data.startDate ? new Date(data.startDate) : null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          clientId: data.clientId,
          notes: data.notes,
        },
      });
      return {
        success: true,
        data: operation,
        message: `Operación "${operation.projectName}" creada exitosamente`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'No se pudo crear la operación',
      };
    }
  }

  async createClient(organizationId: string, data: any) {
    try {
      const client = await this.prisma.client.create({
        data: {
          organizationId,
          name: data.name,
          contactPerson: data.contactPerson,
          email: data.email,
          phone: data.phone,
          address: data.address,
          status: data.status || 'Active',
        },
      });
      return {
        success: true,
        data: client,
        message: `Cliente "${client.name}" creado exitosamente`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'No se pudo crear el cliente',
      };
    }
  }

  async createEvent(organizationId: string, userId: string, data: any) {
    try {
      const event = await this.prisma.event.create({
        data: {
          organizationId,
          userId,
          title: data.title,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          location: data.location,
          status: data.status || 'scheduled',
        },
      });
      return {
        success: true,
        data: event,
        message: `Evento "${event.title}" creado exitosamente`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'No se pudo crear el evento',
      };
    }
  }

  async createTask(organizationId: string, data: any) {
    try {
      const toDoColumn = await this.prisma.column.findFirst({
        where: {
          title: { in: ['To Do', 'Por Hacer', 'Pendiente'] },
        },
      });

      if (!toDoColumn) {
        return {
          success: false,
          error: 'No se encontró una columna para tareas pendientes',
          message: 'No se puede crear la tarea sin una columna válida',
        };
      }

      const task = await this.prisma.task.create({
        data: {
          organizationId,
          columnId: toDoColumn.id,
          title: data.title,
          description: data.description,
          priority: data.priority || 'Medium',
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          operationId: data.operationId,
        },
      });
      return {
        success: true,
        data: task,
        message: `Tarea "${task.title}" creada exitosamente`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'No se pudo crear la tarea',
      };
    }
  }

  async searchOperations(organizationId: string, query: string) {
    try {
      const operations = await this.prisma.operation.findMany({
        where: {
          organizationId,
          OR: [
            { projectName: { contains: query, mode: 'insensitive' } },
            { projectCategory: { contains: query, mode: 'insensitive' } },
            { bookingTracking: { contains: query, mode: 'insensitive' } },
            { mbl_awb: { contains: query, mode: 'insensitive' } },
            { hbl_awb: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: {
          client: true,
        },
      });
      return {
        success: true,
        data: operations,
        message: `Se encontraron ${operations.length} operaciones`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'No se pudieron buscar operaciones',
      };
    }
  }

  async searchClients(organizationId: string, query: string) {
    try {
      const clients = await this.prisma.client.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { contactPerson: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });
      return {
        success: true,
        data: clients,
        message: `Se encontraron ${clients.length} clientes`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'No se pudieron buscar clientes',
      };
    }
  }

  async getUpcomingEvents(organizationId: string) {
    try {
      const events = await this.prisma.event.findMany({
        where: {
          organizationId,
          startDate: {
            gte: new Date(),
          },
        },
        take: 10,
        orderBy: {
          startDate: 'asc',
        },
      });
      return {
        success: true,
        data: events,
        message: `Hay ${events.length} eventos próximos`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'No se pudieron obtener eventos',
      };
    }
  }

  async getPendingTasks(organizationId: string) {
    try {
      const pendingColumns = await this.prisma.column.findMany({
        where: {
          title: { in: ['To Do', 'In Progress', 'Por Hacer', 'En Progreso'] },
        },
        select: {
          id: true,
        },
      });

      const tasks = await this.prisma.task.findMany({
        where: {
          organizationId,
          columnId: {
            in: pendingColumns.map((col) => col.id),
          },
        },
        take: 15,
        orderBy: {
          dueDate: 'asc',
        },
      });
      return {
        success: true,
        data: tasks,
        message: `Hay ${tasks.length} tareas pendientes`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'No se pudieron obtener tareas',
      };
    }
  }
}
