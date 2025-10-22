import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string, operationId?: string) {
    return this.prisma.note.findMany({
      where: {
        ...(userId && { userId }),
        ...(operationId && { operationId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  async create(data: any, userId: string) {
    return this.prisma.note.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.note.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    
    return this.prisma.note.update({ 
      where: { id }, 
      data 
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.note.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    
    return this.prisma.note.delete({ where: { id } });
  }
}
