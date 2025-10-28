import { apiService } from './api';

export interface EmailAccount {
  id: string;
  email: string;
  provider: string;
  status: string;
  syncEmail: boolean;
}

export interface OperationLinkingRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  subjectPattern: string;
  defaultAssigneeIds: string[];
  companyDomains?: string[];
  emailAccountIds?: string[];
  autoCreate: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOperationLinkingRuleDto {
  name: string;
  description?: string;
  subjectPattern: string;
  defaultAssigneeIds: string[];
  companyDomains?: string[];
  emailAccountIds?: string[];
  autoCreate: boolean;
  enabled: boolean;
}

export interface UpdateOperationLinkingRuleDto {
  name?: string;
  description?: string;
  subjectPattern?: string;
  defaultAssigneeIds?: string[];
  companyDomains?: string[];
  emailAccountIds?: string[];
  autoCreate?: boolean;
  enabled?: boolean;
}

class OperationLinkingRulesService {
  async getRules(): Promise<OperationLinkingRule[]> {
    return apiService.get<OperationLinkingRule[]>('/operation-linking-rules');
  }

  async getRule(id: string): Promise<OperationLinkingRule> {
    return apiService.get<OperationLinkingRule>(`/operation-linking-rules/${id}`);
  }

  async getEmailAccounts(): Promise<EmailAccount[]> {
    return apiService.get<EmailAccount[]>('/operation-linking-rules/email-accounts');
  }

  async createRule(data: CreateOperationLinkingRuleDto): Promise<OperationLinkingRule> {
    return apiService.post<OperationLinkingRule>('/operation-linking-rules', data);
  }

  async updateRule(id: string, data: UpdateOperationLinkingRuleDto): Promise<OperationLinkingRule> {
    return apiService.put<OperationLinkingRule>(`/operation-linking-rules/${id}`, data);
  }

  async deleteRule(id: string): Promise<void> {
    return apiService.delete<void>(`/operation-linking-rules/${id}`);
  }
}

export const operationLinkingRulesService = new OperationLinkingRulesService();
