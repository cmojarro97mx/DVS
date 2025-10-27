import axios from 'axios';

const API_URL = '/api/operation-linking-rules';

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
    const response = await axios.get(API_URL);
    return response.data;
  }

  async getRule(id: string): Promise<OperationLinkingRule> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  }

  async createRule(data: CreateOperationLinkingRuleDto): Promise<OperationLinkingRule> {
    const response = await axios.post(API_URL, data);
    return response.data;
  }

  async updateRule(id: string, data: UpdateOperationLinkingRuleDto): Promise<OperationLinkingRule> {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
  }

  async deleteRule(id: string): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  }
}

export const operationLinkingRulesService = new OperationLinkingRulesService();
