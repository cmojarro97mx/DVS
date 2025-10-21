import { apiService } from './api';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  contactPerson?: string;
  website?: string;
  industry?: string;
  tier?: 'Gold' | 'Silver' | 'Bronze' | 'Standard';
  status: 'Active' | 'Inactive';
  notes?: string;
  creditLimit?: number;
  paymentTerms?: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  contactPerson?: string;
  website?: string;
  industry?: string;
  tier?: 'Gold' | 'Silver' | 'Bronze' | 'Standard';
  status: 'Active' | 'Inactive';
  notes?: string;
  creditLimit?: number;
  paymentTerms?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export const clientsService = {
  async getAll(): Promise<Client[]> {
    return apiService.get<Client[]>('/clients');
  },

  async getById(id: string): Promise<Client> {
    return apiService.get<Client>(`/clients/${id}`);
  },

  async create(data: CreateClientData): Promise<Client> {
    return apiService.post<Client>('/clients', data);
  },

  async update(id: string, data: UpdateClientData): Promise<Client> {
    return apiService.put<Client>(`/clients/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/clients/${id}`);
  },
};
