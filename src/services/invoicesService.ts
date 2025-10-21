import { apiService } from './api';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  discount: number;
  discountType: string;
  subTotal: number;
  taxAmount: number;
  total: number;
  status: string;
  notes?: string;
  clientId?: string;
  operationId?: string;
  bankAccountId?: string;
  items: InvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency?: string;
  exchangeRate?: number;
  discount?: number;
  discountType?: string;
  subTotal: number;
  taxAmount?: number;
  total: number;
  status?: string;
  notes?: string;
  clientId?: string;
  operationId?: string;
  bankAccountId?: string;
  items: InvoiceItem[];
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {}

export const invoicesService = {
  async getAll(): Promise<Invoice[]> {
    return apiService.get<Invoice[]>('/invoices');
  },

  async getById(id: string): Promise<Invoice> {
    return apiService.get<Invoice>(`/invoices/${id}`);
  },

  async create(data: CreateInvoiceData): Promise<Invoice> {
    return apiService.post<Invoice>('/invoices', data);
  },

  async update(id: string, data: UpdateInvoiceData): Promise<Invoice> {
    return apiService.put<Invoice>(`/invoices/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/invoices/${id}`);
  },
};
