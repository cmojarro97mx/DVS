import { apiService } from './api';

export interface Employee {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  phone?: string;
  avatar?: string;
  position?: string;
  department?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const employeesService = {
  async getAll(): Promise<Employee[]> {
    return apiService.get<Employee[]>('/users');
  },

  async getById(id: string): Promise<Employee> {
    return apiService.get<Employee>(`/users/${id}`);
  },

  async create(data: { email: string; name: string; password: string; role: string; phone?: string; status?: string }): Promise<Employee> {
    return apiService.post<Employee>('/users', data);
  },

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    return apiService.put<Employee>(`/users/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/users/${id}`);
  },
};
