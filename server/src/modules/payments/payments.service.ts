import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.payment.findMany();
  }

  async findOne(id: string) {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.payment.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.payment.delete({ where: { id } });
  }
}
