import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.note.findMany();
  }

  async findOne(id: string) {
    return this.prisma.note.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.note.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.note.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.note.delete({ where: { id } });
  }
}
