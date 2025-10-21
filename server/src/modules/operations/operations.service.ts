import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.operation.findMany();
  }

  async findOne(id: string) {
    return this.prisma.operation.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.operation.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.operation.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.operation.delete({ where: { id } });
  }
}
