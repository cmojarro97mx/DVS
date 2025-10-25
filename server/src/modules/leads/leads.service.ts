import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.leads.findMany();
  }

  async findOne(id: string) {
    return this.prisma.leads.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.leads.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.leads.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.leads.delete({ where: { id } });
  }
}
