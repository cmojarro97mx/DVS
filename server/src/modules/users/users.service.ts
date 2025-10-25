import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.users.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    // Primero eliminar todos los refresh tokens del usuario para invalidar sus sesiones
    await this.prisma.refresh_tokens.deleteMany({
      where: { userId: id },
    });
    
    // Luego eliminar el usuario (esto también eliminará registros relacionados por CASCADE)
    return this.prisma.users.delete({
      where: { id },
    });
  }
}
