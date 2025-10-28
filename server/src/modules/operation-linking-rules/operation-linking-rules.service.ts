import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class OperationLinkingRulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const rules = await this.prisma.operation_linking_rules.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    
    return rules.map(rule => ({
      ...rule,
      defaultAssigneeIds: Array.isArray(rule.defaultAssignees) ? rule.defaultAssignees : [],
      autoCreate: rule.autoCreateOperations,
    }));
  }

  async findOne(id: string, organizationId: string) {
    const rule = await this.prisma.operation_linking_rules.findFirst({
      where: { id, organizationId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    return {
      ...rule,
      defaultAssigneeIds: Array.isArray(rule.defaultAssignees) ? rule.defaultAssignees : [],
      autoCreate: rule.autoCreateOperations,
    };
  }

  async create(data: any, organizationId: string) {
    const { defaultAssigneeIds, autoCreate, ...rest } = data;
    
    return this.prisma.operation_linking_rules.create({
      data: {
        ...rest,
        organizationId,
        defaultAssignees: defaultAssigneeIds || [],
        autoCreateOperations: autoCreate !== undefined ? autoCreate : true,
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    // Check if exists
    const existing = await this.prisma.operation_linking_rules.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    const { defaultAssigneeIds, autoCreate, ...rest } = data;
    
    const updateData: any = { ...rest };
    
    if (defaultAssigneeIds !== undefined) {
      updateData.defaultAssignees = defaultAssigneeIds;
    }
    
    if (autoCreate !== undefined) {
      updateData.autoCreateOperations = autoCreate;
    }

    return this.prisma.operation_linking_rules.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.operation_linking_rules.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    return this.prisma.operation_linking_rules.delete({
      where: { id: existing.id },
    });
  }

  async getEnabledRules(organizationId: string) {
    return this.prisma.operation_linking_rules.findMany({
      where: {
        organizationId,
        enabled: true,
      },
    });
  }

  async toggleRule(id: string, organizationId: string) {
    const rule = await this.prisma.operation_linking_rules.findFirst({
      where: { id, organizationId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    return this.prisma.operation_linking_rules.update({
      where: { id: rule.id },
      data: { enabled: !rule.enabled },
    });
  }
}
