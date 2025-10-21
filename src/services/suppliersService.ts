import { apiService } from './api';

export interface Supplier {
  id: string;
  name: string;
  rfc?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  services?: string;
  status: 'active' | 'inactive';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const suppliersService = {
  async getAll(): Promise<Supplier[]> {
    return apiService.get<Supplier[]>('/suppliers');
  },

  async getById(id: string): Promise<Supplier> {
    return apiService.get<Supplier>(`/suppliers/${id}`);
  },

  async create(data: Omit<Supplier, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    return apiService.post<Supplier>('/suppliers', data);
  },

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return apiService.put<Supplier>(`/suppliers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/suppliers/${id}`);
  },
};
