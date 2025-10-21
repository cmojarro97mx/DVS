import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.expense.findMany();
  }

  async findOne(id: string) {
    return this.prisma.expense.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.expense.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.expense.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }
}
