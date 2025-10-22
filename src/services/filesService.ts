import { api } from './api';

export interface FileItem {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  folderId?: string;
  folder?: FileFolder;
  createdAt: string;
  updatedAt: string;
}

export interface FileFolder {
  id: string;
  name: string;
  parentId?: string;
  type: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const filesService = {
  async getAllFiles(): Promise<FileItem[]> {
    try {
      const response = await api.get('/files');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },

  async getFile(id: string): Promise<FileItem> {
    try {
      const response = await api.get(`/files/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching file:', error);
      throw error;
    }
  },

  async uploadFile(file: File, folderId?: string): Promise<FileItem> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for large files
      });
      return response.data;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async deleteFile(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  },

  async getAllFolders(): Promise<FileFolder[]> {
    const response = await api.get('/files/folders');
    return response.data;
  },

  async createFolder(name: string, parentId?: string): Promise<FileFolder> {
    const response = await api.post('/files/folder', { name, parentId });
    return response.data;
  },

  async deleteFolder(id: string): Promise<void> {
    await api.delete(`/files/folder/${id}`);
  },
};
