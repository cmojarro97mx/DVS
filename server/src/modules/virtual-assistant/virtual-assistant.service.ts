import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class VirtualAssistantService {
  private genAI: GoogleGenAI;

  constructor(private prisma: PrismaService) {
    this.genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });
  }

  async createAssistant(userId: string, organizationId: string, name?: string) {
    const assistant = await this.prisma.virtualAssistant.create({
      data: {
        userId,
        organizationId,
        name: name || 'Asistente Virtual',
      },
    });

    return assistant;
  }

  async getAssistantByToken(token: string) {
    const assistant = await this.prisma.virtualAssistant.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    });

    if (!assistant) {
      throw new NotFoundException('Asistente no encontrado');
    }

    if (!assistant.enabled) {
      throw new UnauthorizedException('Este asistente está deshabilitado');
    }

    await this.prisma.virtualAssistant.update({
      where: { id: assistant.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: assistant.usageCount + 1,
      },
    });

    return assistant;
  }

  async getAssistantsByOrganization(organizationId: string) {
    return this.prisma.virtualAssistant.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleAssistant(id: string, organizationId: string) {
    const assistant = await this.prisma.virtualAssistant.findFirst({
      where: { id, organizationId },
    });

    if (!assistant) {
      throw new NotFoundException('Asistente no encontrado');
    }

    return this.prisma.virtualAssistant.update({
      where: { id },
      data: { enabled: !assistant.enabled },
    });
  }

  async deleteAssistant(id: string, organizationId: string) {
    const assistant = await this.prisma.virtualAssistant.findFirst({
      where: { id, organizationId },
    });

    if (!assistant) {
      throw new NotFoundException('Asistente no encontrado');
    }

    return this.prisma.virtualAssistant.delete({
      where: { id },
    });
  }

  async getOrganizationContext(organizationId: string) {
    const [operations, clients, employees, events, tasks] = await Promise.all([
      this.prisma.operation.findMany({
        where: { organizationId },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
        },
      }),
      this.prisma.client.findMany({
        where: { organizationId },
        take: 50,
      }),
      this.prisma.employee.findMany({
        where: { organizationId },
      }),
      this.prisma.event.findMany({
        where: { organizationId },
        orderBy: { startDate: 'desc' },
        take: 20,
      }),
      this.prisma.task.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    return {
      operations,
      clients,
      employees,
      events,
      tasks,
    };
  }
}
