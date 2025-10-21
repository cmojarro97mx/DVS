import { apiService } from './api';

export interface Payment {
  id: string;
  paymentDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  clientId?: string;
  invoiceId?: string;
  operationId?: string;
  bankAccountId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentData {
  paymentDate: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  clientId?: string;
  invoiceId?: string;
  operationId?: string;
  bankAccountId?: string;
}

export interface UpdatePaymentData extends Partial<CreatePaymentData> {}

export const paymentsService = {
  async getAll(): Promise<Payment[]> {
    return apiService.get<Payment[]>('/payments');
  },

  async getById(id: string): Promise<Payment> {
    return apiService.get<Payment>(`/payments/${id}`);
  },

  async create(data: CreatePaymentData): Promise<Payment> {
    return apiService.post<Payment>('/payments', data);
  },

  async update(id: string, data: UpdatePaymentData): Promise<Payment> {
    return apiService.put<Payment>(`/payments/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/payments/${id}`);
  },
};
