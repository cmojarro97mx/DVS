import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.employee.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.employee.findFirst({
      where: { id, organizationId },
    });
  }

  async create(data: any, organizationId: string) {
    return this.prisma.employee.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    return this.prisma.employee.updateMany({
      where: { id, organizationId },
      data,
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.employee.deleteMany({
      where: { id, organizationId },
    });
  }
}
