import { apiService } from './api';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  estimatedValue?: number;
  notes?: string;
  assignedTo?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const leadsService = {
  async getAll(): Promise<Lead[]> {
    return apiService.get<Lead[]>('/leads');
  },

  async getById(id: string): Promise<Lead> {
    return apiService.get<Lead>(`/leads/${id}`);
  },

  async create(data: Omit<Lead, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    return apiService.post<Lead>('/leads', data);
  },

  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    return apiService.put<Lead>(`/leads/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/leads/${id}`);
  },
};
