import { apiService } from './api';

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  type: 'meeting' | 'deadline' | 'reminder' | 'other';
  relatedTo?: {
    type: 'operation' | 'client';
    id: string;
  };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const calendarService = {
  async getAll(): Promise<Event[]> {
    return apiService.get<Event[]>('/calendar');
  },

  async getById(id: string): Promise<Event> {
    return apiService.get<Event>(`/calendar/${id}`);
  },

  async create(data: Omit<Event, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    return apiService.post<Event>('/calendar', data);
  },

  async update(id: string, data: Partial<Event>): Promise<Event> {
    return apiService.put<Event>(`/calendar/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/calendar/${id}`);
  },
};
