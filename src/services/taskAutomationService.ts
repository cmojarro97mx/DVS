import { apiService } from './api';

export interface TaskAutomationConfig {
  id?: string;
  enabled: boolean;
  lastRunAt?: string;
  tasksCreated: number;
  tasksUpdated: number;
}

export const taskAutomationService = {
  async getConfig(): Promise<TaskAutomationConfig> {
    return apiService.get<TaskAutomationConfig>('/task-automation/config');
  },

  async toggle(): Promise<TaskAutomationConfig> {
    return apiService.post<TaskAutomationConfig>('/task-automation/toggle', {});
  },

  async processNow(): Promise<{ success: boolean; message: string }> {
    return apiService.post('/task-automation/process-now', {});
  },
};
