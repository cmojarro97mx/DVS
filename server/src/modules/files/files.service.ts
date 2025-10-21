import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.file.findMany();
  }

  async findOne(id: string) {
    return this.prisma.file.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.file.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.file.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.file.delete({ where: { id } });
  }
}
