import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.employee.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, organizationId },
    });
    
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    
    return employee;
  }

  async create(data: any, organizationId: string) {
    return this.prisma.employee.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await this.prisma.employee.findFirst({
      where: { id, organizationId },
    });
    
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    
    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.employee.findFirst({
      where: { id, organizationId },
    });
    
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    
    // Verificar si es el primer empleado de la organización
    const firstEmployee = await this.prisma.employee.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    
    if (firstEmployee && firstEmployee.id === id) {
      throw new NotFoundException(`Cannot delete the first employee of the organization`);
    }
    
    await this.prisma.employee.delete({
      where: { id },
    });
    
    return { success: true };
  }
}
