import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'crypto';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';

@Injectable()
export class TaskAutomationService {
  private readonly logger = new Logger(TaskAutomationService.name);
  private genAI: GoogleGenAI;

  constructor(
    private prisma: PrismaService,
    private knowledgeBase: KnowledgeBaseService,
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
              gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { date: 'desc' },
          take: 5,
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
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

        const relevantEmails = this.filterRelevantEmails(emailsToProcess);

        if (relevantEmails.length === 0) {
          this.logger.log(`Operación ${operation.id}: No hay emails con acciones potenciales`);
          continue;
        }

        const { newTasks, updatedTasks } = await this.analyzeEmailsAndGenerateTasks(
          relevantEmails,
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

  private calculateTextSimilarity(text1: string, text2: string): number {
    const normalize = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);

    if (norm1 === norm2) return 1.0;

    const words1 = new Set(norm1.split(' '));
    const words2 = new Set(norm2.split(' '));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private isTaskDuplicate(newTitle: string, existingTasks: any[]): boolean {
    const SIMILARITY_THRESHOLD = 0.75;

    for (const task of existingTasks) {
      const similarity = this.calculateTextSimilarity(newTitle, task.title);
      if (similarity >= SIMILARITY_THRESHOLD) {
        this.logger.log(`⚠️ Tarea duplicada detectada (similitud ${(similarity * 100).toFixed(0)}%): "${newTitle}" ≈ "${task.title}"`);
        return true;
      }
    }

    return false;
  }

  private filterRelevantEmails(emails: any[]): any[] {
    const actionKeywords = [
      'favor', 'necesito', 'requiero', 'urgente', 'confirmar', 'enviar', 'solicitar',
      'cotizar', 'comprar', 'revisar', 'verificar', 'autorizar', 'aprobar', 'pagar',
      'entregar', 'recibir', 'coordinar', 'agendar', 'programar', 'pendiente',
      'falta', 'debe', 'tienen que', 'hay que', 'please', 'need', 'urgent', 'asap',
      'confirm', 'send', 'request', 'quote', 'buy', 'check', 'verify', 'approve',
      'deliver', 'receive', 'schedule', 'pending', 'missing', 'must', 'should'
    ];

    const irrelevantPatterns = [
      /^re:.*gracias/i,
      /^fwd:/i,
      /newsletter/i,
      /unsubscribe/i,
      /notification/i,
      /^out of office/i,
      /^automatic reply/i,
      /^respuesta automática/i,
    ];

    return emails.filter(email => {
      const subjectAndBody = `${email.subject} ${email.body}`.toLowerCase();
      
      if (irrelevantPatterns.some(pattern => pattern.test(email.subject))) {
        return false;
      }

      const hasActionKeyword = actionKeywords.some(keyword => 
        subjectAndBody.includes(keyword.toLowerCase())
      );

      const hasQuestionMark = subjectAndBody.includes('?');
      const hasAttachments = email.hasAttachments;

      return hasActionKeyword || hasQuestionMark || hasAttachments;
    });
  }

  private async analyzeEmailsAndGenerateTasks(emails: any[], operation: any) {
    let newTasks = 0;
    let updatedTasks = 0;

    for (const email of emails.slice(0, 3)) {
      await this.knowledgeBase.extractKnowledgeFromEmail(
        operation.organizationId,
        null,
        email,
        operation,
      );
    }

    const emailKeywords = emails
      .slice(0, 3)
      .flatMap(e => e.subject.toLowerCase().split(/\s+/))
      .filter((w: string) => w.length > 4);

    const relevantKnowledge = await this.knowledgeBase.getRelevantKnowledge(
      operation.organizationId,
      {
        keywords: emailKeywords.slice(0, 5),
        operationType: operation.operationType,
        limit: 5,
      },
    );

    const emailContents = emails.slice(0, 3).map((email) => {
      const cleanBody = email.body
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 800);
      
      return {
        id: email.id,
        subject: email.subject,
        from: email.from.split('<')[0].trim(),
        date: new Date(email.date).toLocaleDateString('es-MX'),
        body: cleanBody,
        hasAttachments: email.hasAttachments || false,
      };
    });

    const existingTasks = operation.tasks
      .slice(0, 5)
      .map((task: any) => ({
        title: task.title,
        status: task.status,
        priority: task.priority,
      }));

    const knowledgeContext = relevantKnowledge.length > 0
      ? `\nCONTEXTO APRENDIDO:\n${relevantKnowledge.map(k => `• ${k.title}: ${k.content}`).join('\n')}\n`
      : '';

    const prompt = `Analiza emails de operación "${operation.projectName}" (${operation.status}).${knowledgeContext}
TAREAS (últimas 5):
${existingTasks.length > 0 ? existingTasks.map(t => `• ${t.title} [${t.status}]`).join('\n') : 'Sin tareas'}

EMAILS:
${emailContents.map((e, i) => `${i + 1}. ${e.subject} - ${e.from} (${e.date})
${e.body}${e.hasAttachments ? ' [Adjuntos]' : ''}`).join('\n\n')}

REGLAS ESTRICTAS:
- SOLO crea tareas si hay acciones NUEVAS y ESPECÍFICAS que requieren seguimiento
- NO crees tareas si ya existe una similar en la lista de TAREAS
- NO crees múltiples tareas para la misma acción
- Si una tarea existente cubre la acción, NO crees una nueva
- Actualiza el estado de tareas existentes en lugar de crear nuevas
- Priority: High=urgente con fecha límite, Medium=importante, Low=informativo
- Máximo 1-2 tareas nuevas por análisis

JSON puro (sin markdown):
{"newTasks":[{"title":"","description":"","priority":"High|Medium|Low","dueDate":"YYYY-MM-DD o null"}],"taskStatusUpdates":[{"taskTitle":"","newStatus":"To Do|In Progress|Completed","reason":""}],"reasoning":""}`;

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
            if (this.isTaskDuplicate(taskData.title, operation.tasks)) {
              this.logger.log(`⏭️ Tarea omitida (duplicada): "${taskData.title}"`);
              continue;
            }

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
                emailSourceId: emails.length > 0 ? emails[0].id : null,
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
