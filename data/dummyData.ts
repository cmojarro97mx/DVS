import { Project, Client, TeamMember, Task, Column, EmailAccount, EmailMessage, Event, Lead, Quotation, ReconciliationSession, BankTransaction, SatInvoice, BankAccount, Invoice, Payment, Expense, Note, FileSystemItem } from "../pages/DashboardPage";

export const initialTeamMembers: TeamMember[] = [];

export const initialClients: Client[] = [];

export const initialProjects: Project[] = [];

export const initialNotes: Note[] = [];

export const initialBankAccounts: BankAccount[] = [];

export const initialInvoices: Invoice[] = [];

export const initialPayments: Payment[] = [];

export const initialExpenses: Expense[] = [];

export const initialQuotations: Quotation[] = [];

export const initialTasksData: Record<string, Task> = {};

export const initialAccounts: EmailAccount[] = [];

export const initialEmails: EmailMessage[] = [];

export const initialEvents: Event[] = [];

export const initialColumnsData: Record<string, Column> = {
  'column-1': { id: 'column-1', title: 'To Do', taskIds: [] },
  'column-2': { id: 'column-2', title: 'In Progress', taskIds: [] },
  'column-3': { id: 'column-3', title: 'Done', taskIds: [] },
};

export const initialColumnOrderData: string[] = ['column-1', 'column-2', 'column-3'];

export const mockBankTransactions: BankTransaction[] = [];

export const mockReceivedInvoices: SatInvoice[] = [];

export const mockIssuedInvoices: SatInvoice[] = [];

export const initialReconciliationHistory: ReconciliationSession[] = [];
