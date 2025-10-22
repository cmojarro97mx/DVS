import { apiService } from './api';

export interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil?: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientCompany?: string;
  status: string;
  currency: string;
  items: any;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  termsConditions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const quotationsService = {
  async getAll(): Promise<Quotation[]> {
    return apiService.get<Quotation[]>('/quotations');
  },

  async getById(id: string): Promise<Quotation> {
    return apiService.get<Quotation>(`/quotations/${id}`);
  },

  async create(data: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quotation> {
    return apiService.post<Quotation>('/quotations', data);
  },

  async update(id: string, data: Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Quotation> {
    return apiService.put<Quotation>(`/quotations/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/quotations/${id}`);
  },
};
