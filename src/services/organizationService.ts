import { apiService } from './api';
import type { Organization } from '../types/auth';

interface UpdateOrganizationData {
  name?: string;
  rfc?: string;
  taxRegime?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  website?: string;
}

export const organizationService = {
  async getCurrentOrganization(): Promise<Organization> {
    return apiService.get<Organization>('/organizations/current');
  },

  async updateOrganization(data: UpdateOrganizationData): Promise<Organization> {
    return apiService.put<Organization>('/organizations/current', data);
  },
};
