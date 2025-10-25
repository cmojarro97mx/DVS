import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'crypto';

@Injectable()
export class TaskAutomationService {
  private readonly logger = new Logger(TaskAutomationService.name);
  private genAI: GoogleGenAI;

  constructor(
    private prisma: PrismaService,
  ) {
    this.genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });
  }

  async createOrUpdateAutomation(organizationId: string, enabled?: boolean) {
    const existingAutomation = await this.prisma.automations.findFirst({
      where: {
        organizationId,
        type: 'task_automation',
      },
    });

    if (existingAutomation) {
      return this.prisma.automations.update({
        where: { id: existingAutomation.id },
        data: {
          enabled: enabled !== undefined ? enabled : existingAutomation.enabled,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.automations.create({
      data: {
        id: randomUUID(),
        name: 'Automatización de Tareas',
        description: 'Crea y actualiza tareas automáticamente basándose en el análisis de emails vinculados a operaciones',
        type: 'task_automation',
        enabled: enabled !== undefined ? enabled : false,
        updatedAt: new Date(),
        conditions: {
          analyzeAttachments: true,
          createRecommendedTasks: true,
          updateTaskStatus: true,
        },
        organizations: {
          connect: { id: organizationId },
        },
      },
    });
  }

  async getAutomation(organizationId: string) {
    return this.prisma.automations.findFirst({
      where: {
        organizationId,
        type: 'task_automation',
      },
    });
  }

  async toggleAutomation(organizationId: string) {
    const automation = await this.getAutomation(organizationId);
    const newEnabledState = automation ? !automation.enabled : true;

    if (newEnabledState) {
      const emailAccounts = await this.prisma.email_accounts.count({
        where: {
          users: {
            organizationId: organizationId,
          },
        },
      });

      if (emailAccounts === 0) {
        throw new Error('NO_EMAIL_ACCOUNTS');
      }
    }

    if (!automation) {
      return this.createOrUpdateAutomation(organizationId, true);
    }

    return this.prisma.automations.update({
      where: { id: automation.id },
      data: { enabled: !automation.enabled },
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processEmailsForTasks() {
    try {
      this.logger.log('🤖 Iniciando procesamiento de emails para automatización de tareas...');

      const activeAutomations = await this.prisma.automations.findMany({
        where: {
          type: 'task_automation',
          enabled: true,
        },
      });

      if (activeAutomations.length === 0) {
        this.logger.log('No hay automatizaciones de tareas activas');
        return;
      }

      let totalTasksCreated = 0;
      let totalTasksUpdated = 0;

      for (const automation of activeAutomations) {
        try {
          const { created, updated } = await this.processOrganizationEmails(automation.organizationId);
          totalTasksCreated += created;
          totalTasksUpdated += updated;

          await this.prisma.automations.update({
            where: { id: automation.id },
            data: {
              lastRunAt: new Date(),
              tasksCreated: automation.tasksCreated + created,
              tasksUpdated: automation.tasksUpdated + updated,
            },
          });

          this.logger.log(`✅ Organización ${automation.organizationId}: ${created} tareas creadas, ${updated} actualizadas`);
        } catch (error) {
          this.logger.error(`Error procesando organización ${automation.organizationId}:`, error.message);
        }
      }

      this.logger.log(`🎉 Procesamiento completado: ${totalTasksCreated} tareas creadas, ${totalTasksUpdated} actualizadas`);
    } catch (error) {
      this.logger.error('Error en procesamiento de automatización de tareas:', error);
    }
  }

  private async processOrganizationEmails(organizationId: string) {
    let tasksCreated = 0;
    let tasksUpdated = 0;

    const operations = await this.prisma.operations.findMany({
      where: {
        organizationId,
        status: { notIn: ['cancelled', 'completed'] },
      },
      include: {
        email_messages: {
          where: {
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { date: 'desc' },
          take: 20,
        },
        tasks: {
          include: {
            task_assignees: true,
          },
        },
      },
    });

    for (const operation of operations) {
      if (operation.email_messages.length === 0) continue;

      try {
        const emailsToProcess = operation.email_messages.filter(
          email => !operation.tasks.some(task => task.emailSourceId === email.id)
        );

        if (emailsToProcess.length === 0) continue;

        const { newTasks, updatedTasks } = await this.analyzeEmailsAndGenerateTasks(
          emailsToProcess,
          operation,
        );

        tasksCreated += newTasks;
        tasksUpdated += updatedTasks;
      } catch (error) {
        this.logger.error(`Error procesando operación ${operation.id}:`, error.message);
      }
    }

    return { created: tasksCreated, updated: tasksUpdated };
  }

  private async analyzeEmailsAndGenerateTasks(emails: any[], operation: any) {
    let newTasks = 0;
    let updatedTasks = 0;

    const emailContents = emails.map((email) => ({
      id: email.id,
      subject: email.subject,
      from: email.from,
      date: email.date,
      body: email.body.substring(0, 3000),
      hasAttachments: email.hasAttachments || false,
      attachmentCount: email.attachmentsData ? (email.attachmentsData as any[]).length : 0,
    }));

    const existingTasks = operation.tasks.map((task: any) => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
    }));

    const prompt = `Eres un asistente experto en gestión de operaciones logísticas y comerciales.

OPERACIÓN:
- Nombre: ${operation.projectName}
- Tipo: ${operation.operationType || 'N/A'}
- Estado: ${operation.status}
- Tracking: ${operation.bookingTracking || 'N/A'}
- MBL/AWB: ${operation.mbl_awb || 'N/A'}
- HBL/AWB: ${operation.hbl_awb || 'N/A'}

TAREAS EXISTENTES:
${existingTasks.length > 0 ? JSON.stringify(existingTasks, null, 2) : 'No hay tareas existentes'}

EMAILS VINCULADOS (últimos 7 días):
${emailContents.map((e, i) => `
Email ${i + 1}:
- Asunto: ${e.subject}
- De: ${e.from}
- Fecha: ${e.date}
- Tiene adjuntos: ${e.hasAttachments ? `Sí (${e.attachmentCount})` : 'No'}
- Contenido: ${e.body}
`).join('\n---\n')}

INSTRUCCIONES:
1. Analiza SOLO el texto del asunto y cuerpo de los emails para identificar acciones necesarias
2. Si el email menciona adjuntos, infiere las acciones basándote en el contexto del asunto y cuerpo (NO tienes acceso al contenido de los archivos adjuntos)
3. SOLO crea tareas si son necesarias y relevantes para la operación
4. NO crees tareas duplicadas o similares a las existentes
5. NO crees tareas genéricas o basura
6. Prioriza según urgencia: High (urgente), Medium (importante), Low (normal)
7. Sugiere también actualizar el status de tareas existentes si el email indica que se completaron

Responde SOLO con un objeto JSON válido (sin markdown):
{
  "newTasks": [
    {
      "title": "Título conciso y claro",
      "description": "Descripción detallada con contexto del email",
      "priority": "High|Medium|Low",
      "dueDate": "YYYY-MM-DD o null"
    }
  ],
  "taskStatusUpdates": [
    {
      "taskTitle": "título exacto de tarea existente",
      "newStatus": "To Do|In Progress|Completed",
      "reason": "razón del cambio basada en el email"
    }
  ],
  "reasoning": "Explicación breve de las decisiones tomadas"
}

Si NO hay tareas que crear o actualizar, responde:
{
  "newTasks": [],
  "taskStatusUpdates": [],
  "reasoning": "No se encontraron acciones necesarias en los emails analizados"
}`;

    try {
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });
      const responseText = result.text.trim();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('No se pudo extraer JSON de la respuesta de IA');
        return { newTasks: 0, updatedTasks: 0 };
      }

      const aiResponse = JSON.parse(jsonMatch[0]);
      this.logger.log(`🧠 IA analizó emails para operación ${operation.id}: ${aiResponse.reasoning}`);

      if (aiResponse.newTasks && aiResponse.newTasks.length > 0) {
        const AUTOMATED_USER_ID = 'automated-system-user';
        
        for (const taskData of aiResponse.newTasks) {
          try {
            const task = await this.prisma.tasks.create({
              data: {
                id: randomUUID(),
                title: taskData.title,
                description: taskData.description || '',
                priority: taskData.priority || 'Medium',
                dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
                status: 'To Do',
                updatedAt: new Date(),
                createdBy: 'automation' as const,
                lastModifiedBy: 'automation' as const,
                operations: operation.id ? {
                  connect: { id: operation.id },
                } : undefined,
                organizations: operation.organizationId ? {
                  connect: { id: operation.organizationId },
                } : undefined,
              },
            });

            await this.prisma.task_assignees.create({
              data: {
                id: randomUUID(),
                tasks: {
                  connect: { id: task.id },
                },
                users: {
                  connect: { id: AUTOMATED_USER_ID },
                },
              },
            });

            newTasks++;
            this.logger.log(`✅ Nueva tarea creada y asignada a usuario automatizado: ${taskData.title}`);
          } catch (error) {
            this.logger.error(`Error creando tarea "${taskData.title}":`, error.message);
          }
        }
      }

      if (aiResponse.taskStatusUpdates && aiResponse.taskStatusUpdates.length > 0) {
        for (const update of aiResponse.taskStatusUpdates) {
          try {
            const taskToUpdate = operation.tasks.find(
              (t: any) => t.title.toLowerCase().includes(update.taskTitle.toLowerCase())
            );

            if (taskToUpdate && taskToUpdate.status !== update.newStatus) {
              await this.prisma.tasks.update({
                where: { id: taskToUpdate.id },
                data: {
                  status: update.newStatus,
                  lastModifiedBy: 'automation' as const,
                },
              });
              updatedTasks++;
              this.logger.log(`✅ Tarea actualizada: ${taskToUpdate.title} -> ${update.newStatus}`);
            }
          } catch (error) {
            this.logger.error(`Error actualizando tarea "${update.taskTitle}":`, error.message);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error en análisis de IA:', error.message);
    }

    return { newTasks, updatedTasks };
  }
}
