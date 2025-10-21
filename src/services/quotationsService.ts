import { apiService } from './api';

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientId: string;
  date: string;
  validUntil: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const quotationsService = {
  async getAll(): Promise<Quotation[]> {
    return apiService.get<Quotation[]>('/quotations');
  },

  async getById(id: string): Promise<Quotation> {
    return apiService.get<Quotation>(`/quotations/${id}`);
  },

  async create(data: Omit<Quotation, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Quotation> {
    return apiService.post<Quotation>('/quotations', data);
  },

  async update(id: string, data: Partial<Quotation>): Promise<Quotation> {
    return apiService.put<Quotation>(`/quotations/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/quotations/${id}`);
  },
};
