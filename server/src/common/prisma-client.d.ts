import { PrismaClient } from '@prisma/client';

declare module '@prisma/client' {
  interface PrismaClient {
    readonly task: PrismaClient['tasks'];
    readonly automation: PrismaClient['automations'];
    readonly operation: PrismaClient['operations'];
    readonly employee: PrismaClient['employees'];
    readonly client: PrismaClient['clients'];
    readonly user: PrismaClient['users'];
    readonly event: PrismaClient['events'];
    readonly quotation: PrismaClient['quotations'];
    readonly invoice: PrismaClient['invoices'];
    readonly virtualAssistant: PrismaClient['virtual_assistants'];
    readonly taskAssignee: PrismaClient['task_assignees'];
    readonly emailAccount: PrismaClient['email_accounts'];
    readonly refreshToken: PrismaClient['refresh_tokens'];
    readonly bankAccount: PrismaClient['bank_accounts'];
  }
}
