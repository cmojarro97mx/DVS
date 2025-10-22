import { apiService } from './api';

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  attendees?: any;
  color?: string;
  allDay: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const calendarService = {
  async getAll(): Promise<Event[]> {
    return apiService.get<Event[]>('/calendar');
  },

  async getById(id: string): Promise<Event> {
    return apiService.get<Event>(`/calendar/${id}`);
  },

  async create(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    return apiService.post<Event>('/calendar', data);
  },

  async update(id: string, data: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Event> {
    return apiService.put<Event>(`/calendar/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/calendar/${id}`);
  },
};
