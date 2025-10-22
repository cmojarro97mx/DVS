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
    console.log('[filesService] Fetching all files...');
    try {
      const response = await api.get('/files');
      console.log('[filesService] Response:', response);
      
      // Validar que response existe y tiene data
      if (!response) {
        console.error('[filesService] No response received');
        return [];
      }
      
      // El api.get ya devuelve directamente los datos, no response.data
      const data = Array.isArray(response) ? response : [];
      console.log(`[filesService] Fetched ${data.length} files`);
      return data;
    } catch (error: any) {
      console.error('[filesService] Error fetching files:', error);
      console.error('[filesService] Error response:', error.response?.data);
      console.error('[filesService] Error status:', error.response?.status);
      throw error;
    }
  },

  async getFile(id: string): Promise<FileItem> {
    try {
      const response = await api.get(`/files/${id}`);
      return response;
    } catch (error: any) {
      console.error('[filesService] Error fetching file:', error);
      throw error;
    }
  },

  async uploadFile(file: File, folderId?: string): Promise<FileItem> {
    console.log(`[filesService] Uploading file: ${file.name}, size: ${file.size}, folder: ${folderId || 'root'}`);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      console.log('[filesService] Sending upload request to /files/upload');
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for large files
      });
      
      console.log('[filesService] Upload successful:', response);
      return response;
    } catch (error: any) {
      console.error('[filesService] Error uploading file:', error);
      console.error('[filesService] Error response:', error.response?.data);
      console.error('[filesService] Error status:', error.response?.status);
      throw error;
    }
  },

  async deleteFile(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  },

  async getAllFolders(): Promise<FileFolder[]> {
    console.log('[filesService] Fetching all folders...');
    try {
      const response = await api.get('/files/folders');
      console.log('[filesService] Response:', response);
      
      const data = Array.isArray(response) ? response : [];
      console.log(`[filesService] Fetched ${data.length} folders`);
      return data;
    } catch (error: any) {
      console.error('[filesService] Error fetching folders:', error);
      console.error('[filesService] Error response:', error.response?.data);
      throw error;
    }
  },

  async createFolder(name: string, parentId?: string): Promise<FileFolder> {
    const response = await api.post('/files/folder', { name, parentId });
    return response;
  },

  async deleteFolder(id: string): Promise<void> {
    await api.delete(`/files/folder/${id}`);
  },
};
