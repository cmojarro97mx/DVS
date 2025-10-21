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
};
