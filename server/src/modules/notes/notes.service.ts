import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, userId?: string, operationId?: string) {
    return this.prisma.note.findMany({
      where: {
        organizationId,
        ...(userId && { userId }),
        ...(operationId && { operationId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const note = await this.prisma.note.findFirst({ 
      where: { 
        id,
        organizationId,
      } 
    });
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  async create(data: any, userId: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    return this.prisma.note.create({
      data: {
        ...data,
        author: user?.name || 'Usuario',
        userId,
        organizationId,
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await this.prisma.note.findFirst({ 
      where: { 
        id,
        organizationId,
      } 
    });
    if (!existing) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    
    const { organizationId: _, userId: __, ...updateData } = data;
    
    return this.prisma.note.update({ 
      where: { id }, 
      data: updateData 
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.note.findFirst({ 
      where: { 
        id,
        organizationId,
      } 
    });
    if (!existing) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    
    return this.prisma.note.delete({ where: { id } });
  }
}
