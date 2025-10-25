import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'crypto';

@Injectable()
export class VirtualAssistantService {
  private genAI: GoogleGenAI;

  constructor(private prisma: PrismaService) {
    this.genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });
  }

  async createAssistant(userId: string, organizationId: string, name?: string) {
    const defaultSettings = {
      welcomeMessage: 'Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      systemInstructions: 'Eres un asistente virtual profesional y amigable. Ayudas con información sobre operaciones, clientes, tareas y eventos.',
      personality: 'profesional',
    };

    const assistant = await this.prisma.virtual_assistants.create({
      data: {
        id: randomUUID(),
        updatedAt: new Date(),
        userId,
        token: randomUUID(),
        organizations: { connect: { id: organizationId } },
        name: name || 'Asistente Virtual',
        settings: defaultSettings,
      },
    });

    return assistant;
  }

  async updateAssistant(
    id: string,
    organizationId: string,
    data: {
      name?: string;
      settings?: {
        welcomeMessage?: string;
        systemInstructions?: string;
        personality?: string;
      };
    },
  ) {
    const assistant = await this.prisma.virtual_assistants.findFirst({
      where: { id, organizationId },
    });

    if (!assistant) {
      throw new NotFoundException('Asistente no encontrado');
    }

    const currentSettings = (assistant.settings as any) || {};
    const updatedSettings = data.settings
      ? { ...currentSettings, ...data.settings }
      : currentSettings;

    return this.prisma.virtual_assistants.update({
      where: { id },
      data: {
        name: data.name,
        settings: updatedSettings,
      },
    });
  }

  async getAssistantByToken(token: string) {
    const assistant = await this.prisma.virtual_assistants.findUnique({
      where: { token },
      include: {
        organizations: true,
      },
    });

    if (!assistant) {
      throw new NotFoundException('Asistente no encontrado');
    }

    if (!assistant.enabled) {
      throw new UnauthorizedException('Este asistente está deshabilitado');
    }

    await this.prisma.virtual_assistants.update({
      where: { id: assistant.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: assistant.usageCount + 1,
      },
    });

    return assistant;
  }

  async getAssistantsByOrganization(organizationId: string) {
    return this.prisma.virtual_assistants.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleAssistant(id: string, organizationId: string) {
    const assistant = await this.prisma.virtual_assistants.findFirst({
      where: { id, organizationId },
    });

    if (!assistant) {
      throw new NotFoundException('Asistente no encontrado');
    }

    return this.prisma.virtual_assistants.update({
      where: { id },
      data: { enabled: !assistant.enabled },
    });
  }

  async deleteAssistant(id: string, organizationId: string) {
    const assistant = await this.prisma.virtual_assistants.findFirst({
      where: { id, organizationId },
    });

    if (!assistant) {
      throw new NotFoundException('Asistente no encontrado');
    }

    return this.prisma.virtual_assistants.delete({
      where: { id },
    });
  }

  async getOrganizationContext(organizationId: string) {
    const [operations, clients, employees, events, tasks] = await Promise.all([
      this.prisma.operations.findMany({
        where: { organizationId },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          clients: true,
        },
      }),
      this.prisma.clients.findMany({
        where: { organizationId },
        take: 50,
      }),
      this.prisma.employees.findMany({
        where: { organizationId },
      }),
      this.prisma.events.findMany({
        where: { organizationId },
        orderBy: { startDate: 'desc' },
        take: 20,
      }),
      this.prisma.tasks.findMany({
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
