import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, userId?: string, operationId?: string) {
    return this.prisma.notes.findMany({
      where: {
        organizationId,
        ...(userId && { userId }),
        ...(operationId && { operationId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const note = await this.prisma.notes.findFirst({ 
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
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const { operationId, content, attachmentUrl, attachmentName } = data;

    return this.prisma.notes.create({
      data: {
        id: randomUUID(),
        updatedAt: new Date(),
        content,
        author: user?.name || 'Usuario',
        users: { connect: { id: userId } },
        organizations: { connect: { id: organizationId } },
        ...(operationId && { operations: { connect: { id: operationId } } }),
        ...(attachmentUrl && { attachmentUrl }),
        ...(attachmentName && { attachmentName }),
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await this.prisma.notes.findFirst({ 
      where: { 
        id,
        organizationId,
      } 
    });
    if (!existing) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    
    const { organizationId: _, userId: __, ...updateData } = data;
    
    return this.prisma.notes.update({ 
      where: { id }, 
      data: updateData 
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.notes.findFirst({ 
      where: { 
        id,
        organizationId,
      } 
    });
    if (!existing) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    
    return this.prisma.notes.delete({ where: { id } });
  }
}
