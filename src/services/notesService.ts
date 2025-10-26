import { apiService } from './api';

export interface Note {
  id: string;
  title?: string;
  content: string;
  author: string;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  operationId?: string;
  userId?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt?: string;
  updatedAt?: string;
  organizationId?: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  operationId?: string;
}

export interface UpdateNoteData extends Partial<CreateNoteData> {}

export const notesService = {
  async getAll(operationId?: string): Promise<Note[]> {
    const query = operationId ? `?operationId=${operationId}` : '';
    return apiService.get<Note[]>(`/notes${query}`);
  },

  async getById(id: string): Promise<Note> {
    return apiService.get<Note>(`/notes/${id}`);
  },

  async create(data: CreateNoteData): Promise<Note> {
    return apiService.post<Note>('/notes', data);
  },

  async update(id: string, data: UpdateNoteData): Promise<Note> {
    return apiService.put<Note>(`/notes/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/notes/${id}`);
  },
};
