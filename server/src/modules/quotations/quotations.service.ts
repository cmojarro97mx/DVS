import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.quotation.findMany();
  }

  async findOne(id: string) {
    return this.prisma.quotation.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.quotation.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.quotation.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.quotation.delete({ where: { id } });
  }
}
