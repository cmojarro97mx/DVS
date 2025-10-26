import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.quotations.findMany({
      where: { organizationId },
      include: { clients: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.quotations.findFirst({
      where: { id, organizationId },
      include: { clients: true },
    });
  }

  async create(data: any, organizationId: string) {
    return this.prisma.quotations.create({
      data: {
        ...data,
        organizationId,
        updatedAt: new Date(),
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    return this.prisma.quotations.update({
      where: { id },
      data: {
        ...data,
        organizationId,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.quotations.delete({
      where: { id, organizationId },
    });
  }
}
