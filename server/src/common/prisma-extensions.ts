import { PrismaClient } from '@prisma/client';

export function extendPrismaClient(prisma: PrismaClient) {
  return Object.assign(prisma, {
    get task() { return prisma.tasks; },
    get automation() { return prisma.automations; },
    get operation() { return prisma.operations; },
    get employee() { return prisma.employees; },
    get client() { return prisma.clients; },
    get user() { return prisma.users; },
    get event() { return prisma.events; },
    get quotation() { return prisma.quotations; },
    get invoice() { return prisma.invoices; },
    get virtualAssistant() { return prisma.virtual_assistants; },
    get taskAssignee() { return prisma.task_assignees; },
    get emailAccount() { return prisma.email_accounts; },
    get refreshToken() { return prisma.refresh_tokens; },
    get bankAccount() { return prisma.bank_accounts; },
  });
}
