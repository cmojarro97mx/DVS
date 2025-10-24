import { apiService } from './api';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  dueDate?: string;
  columnId: string;
  operationId?: string;
  order: number;
  assignees?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  columnId?: string;
  operationId?: string;
  order?: number;
  assignees?: string[];
}

export interface UpdateTaskData extends Partial<CreateTaskData> {}

export const tasksService = {
  async getAll(operationId?: string): Promise<Task[]> {
    const query = operationId ? `?operationId=${operationId}` : '';
    return apiService.get<Task[]>(`/tasks${query}`);
  },

  async getById(id: string): Promise<Task> {
    return apiService.get<Task>(`/tasks/${id}`);
  },

  async create(data: CreateTaskData): Promise<Task> {
    return apiService.post<Task>('/tasks', data);
  },

  async update(id: string, data: UpdateTaskData): Promise<Task> {
    return apiService.put<Task>(`/tasks/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/tasks/${id}`);
  },
};
