import { apiService } from './api';

export interface Automation {
  id: string;
  name: string;
  description?: string;
  type: string;
  enabled: boolean;
  trigger?: any;
  actions?: any;
  conditions?: any;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationData {
  name: string;
  description?: string;
  type: string;
  enabled?: boolean;
  trigger?: any;
  actions?: any;
  conditions?: any;
}

export const automationsService = {
  async getAll(): Promise<Automation[]> {
    return apiService.get<Automation[]>('/automations');
  },

  async getById(id: string): Promise<Automation> {
    return apiService.get<Automation>(`/automations/${id}`);
  },

  async create(data: CreateAutomationData): Promise<Automation> {
    return apiService.post<Automation>('/automations', data);
  },

  async update(id: string, data: Partial<CreateAutomationData>): Promise<Automation> {
    return apiService.put<Automation>(`/automations/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/automations/${id}`);
  },

  async toggleEnabled(id: string): Promise<Automation> {
    return apiService.post<Automation>(`/automations/${id}/toggle`, {});
  },
};
