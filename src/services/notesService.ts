import { apiService } from './api';

export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  isPinned: boolean;
  operationId?: string;
  createdAt?: string;
  updatedAt?: string;
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
  async getAll(): Promise<Note[]> {
    return apiService.get<Note[]>('/notes');
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
