import { apiService } from './api';

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'credit';
  currency: string;
  balance: number;
  status: 'active' | 'inactive';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const bankAccountsService = {
  async getAll(): Promise<BankAccount[]> {
    return apiService.get<BankAccount[]>('/bank-accounts');
  },

  async getById(id: string): Promise<BankAccount> {
    return apiService.get<BankAccount>(`/bank-accounts/${id}`);
  },

  async create(data: Omit<BankAccount, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<BankAccount> {
    return apiService.post<BankAccount>('/bank-accounts', data);
  },

  async update(id: string, data: Partial<BankAccount>): Promise<BankAccount> {
    return apiService.put<BankAccount>(`/bank-accounts/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/bank-accounts/${id}`);
  },
};
