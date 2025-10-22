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
    return apiService.get<Employee[]>('/employees');
  },

  async getById(id: string): Promise<Employee> {
    return apiService.get<Employee>(`/employees/${id}`);
  },

  async create(data: { email: string; name: string; role: string; phone?: string; status?: string }): Promise<Employee> {
    return apiService.post<Employee>('/employees', data);
  },

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    return apiService.put<Employee>(`/employees/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/employees/${id}`);
  },
};
