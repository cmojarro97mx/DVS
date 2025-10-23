import { apiService } from './api';

export interface Operation {
  id: string;
  projectName: string;
  projectCategory?: string;
  startDate?: string;
  deadline?: string;
  status: string;
  progress: number;
  operationType?: string;
  insurance?: string;
  shippingMode?: string;
  courrier?: string;
  bookingTracking?: string;
  etd?: string;
  eta?: string;
  pickupDate?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  mbl_awb?: string;
  hbl_awb?: string;
  notes?: string;
  currency?: string;
  clientId?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  assignees?: string[];
}

export interface CreateOperationData {
  projectName: string;
  projectCategory?: string;
  startDate?: string;
  deadline?: string;
  status?: string;
  progress?: number;
  operationType?: string;
  insurance?: string;
  shippingMode?: string;
  courrier?: string;
  bookingTracking?: string;
  etd?: string;
  eta?: string;
  pickupDate?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  mbl_awb?: string;
  hbl_awb?: string;
  notes?: string;
  currency?: string;
  clientId?: string;
  assignees?: string[];
}

export interface UpdateOperationData extends Partial<CreateOperationData> {}

export const operationsService = {
  async getAll(): Promise<Operation[]> {
    return apiService.get<Operation[]>('/operations');
  },

  async getById(id: string): Promise<Operation> {
    return apiService.get<Operation>(`/operations/${id}`);
  },

  async create(data: CreateOperationData): Promise<Operation> {
    return apiService.post<Operation>('/operations', data);
  },

  async update(id: string, data: UpdateOperationData): Promise<Operation> {
    return apiService.put<Operation>(`/operations/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/operations/${id}`);
  },

  async getDocuments(operationId: string): Promise<any[]> {
    return apiService.get<any[]>(`/operations/${operationId}/documents`);
  },

  async uploadDocument(operationId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/operations/${operationId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload document');
    }

    return response.json();
  },

  async deleteDocument(operationId: string, documentId: string): Promise<void> {
    return apiService.delete<void>(`/operations/${operationId}/documents/${documentId}`);
  },

  async updateCommissionHistory(operationId: string, commissionHistory: any): Promise<Operation> {
    return apiService.put<Operation>(`/operations/${operationId}/commissions`, { commissionHistory });
  },

  async getRelatedEmails(operationId: string): Promise<any[]> {
    return apiService.get<any[]>(`/operations/${operationId}/emails`);
  },
};
