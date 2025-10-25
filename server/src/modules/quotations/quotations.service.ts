import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.quotations.findMany();
  }

  async findOne(id: string) {
    return this.prisma.quotations.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.quotations.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.quotations.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.quotations.delete({ where: { id } });
  }
}
