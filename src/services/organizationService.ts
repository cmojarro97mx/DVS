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

  async uploadLogo(file: File): Promise<Organization> {
    const formData = new FormData();
    formData.append('logo', file);

    const token = apiService.getAccessToken();
    const response = await fetch('/api/organizations/current/logo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload logo');
    }

    return response.json();
  },
};
