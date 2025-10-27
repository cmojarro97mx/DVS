import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class OperationLinkingRulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.operation_linking_rules.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const rule = await this.prisma.operation_linking_rules.findFirst({
      where: { id, organizationId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    return rule;
  }

  async create(data: any, organizationId: string) {
    return this.prisma.operation_linking_rules.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await this.findOne(id, organizationId);

    return this.prisma.operation_linking_rules.update({
      where: { id: existing.id },
      data,
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.findOne(id, organizationId);

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
    const rule = await this.findOne(id, organizationId);

    return this.prisma.operation_linking_rules.update({
      where: { id: rule.id },
      data: { enabled: !rule.enabled },
    });
  }
}
