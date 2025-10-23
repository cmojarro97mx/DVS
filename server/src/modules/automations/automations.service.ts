import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AutomationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.automation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const automation = await this.prisma.automation.findFirst({
      where: { id, organizationId },
    });

    if (!automation) {
      throw new NotFoundException(`Automation with ID ${id} not found`);
    }

    return automation;
  }

  async create(data: any, organizationId: string) {
    return this.prisma.automation.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    const automation = await this.findOne(id, organizationId);

    return this.prisma.automation.update({
      where: { id: automation.id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const automation = await this.findOne(id, organizationId);

    await this.prisma.automation.delete({
      where: { id: automation.id },
    });

    return { success: true };
  }

  async toggleEnabled(id: string, organizationId: string) {
    const automation = await this.findOne(id, organizationId);

    return this.prisma.automation.update({
      where: { id: automation.id },
      data: { enabled: !automation.enabled },
    });
  }
}
