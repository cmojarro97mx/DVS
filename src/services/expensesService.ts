import { apiService } from './api';

export interface Expense {
  id: string;
  expenseDate: string;
  amount: number;
  currency: string;
  category: string;
  description?: string;
  notes?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  operationId?: string;
  bankAccountId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseData {
  expenseDate: string;
  amount: number;
  currency?: string;
  category: string;
  description?: string;
  notes?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  operationId?: string;
  bankAccountId?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

export const expensesService = {
  async getAll(): Promise<Expense[]> {
    return apiService.get<Expense[]>('/expenses');
  },

  async getById(id: string): Promise<Expense> {
    return apiService.get<Expense>(`/expenses/${id}`);
  },

  async create(data: CreateExpenseData): Promise<Expense> {
    return apiService.post<Expense>('/expenses', data);
  },

  async update(id: string, data: UpdateExpenseData): Promise<Expense> {
    return apiService.put<Expense>(`/expenses/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/expenses/${id}`);
  },
};
