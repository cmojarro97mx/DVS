import { apiService } from './api';

export interface OperationLinkingRule {
  id: string;
  organizationId: string;
  subjectPattern: string;
  defaultAssigneeIds: string[];
  autoCreate: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOperationLinkingRuleDto {
  subjectPattern: string;
  defaultAssigneeIds: string[];
  autoCreate: boolean;
  enabled: boolean;
}

export interface UpdateOperationLinkingRuleDto {
  subjectPattern?: string;
  defaultAssigneeIds?: string[];
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
