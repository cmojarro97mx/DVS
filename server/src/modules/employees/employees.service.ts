import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const AUTOMATED_EMPLOYEE_ID = 'automated-system-employee';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const employees = await this.prisma.employees.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`📋 [EMPLOYEES] Found ${employees.length} employees for organization ${organizationId}`);
    employees.forEach(emp => {
      console.log(`  - Employee: ${emp.name} (ID: ${emp.id}, userId: ${emp.userId || 'NO USER ID'})`);
    });
    
    return employees;
  }

  async findOne(id: string, organizationId: string) {
    const employee = await this.prisma.employees.findFirst({
      where: { id, organizationId },
    });
    
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    
    return employee;
  }

  async create(data: any, organizationId: string) {
    return this.prisma.employees.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    if (id === AUTOMATED_EMPLOYEE_ID) {
      throw new BadRequestException('El empleado automatizado no puede ser editado');
    }

    const existing = await this.prisma.employees.findFirst({
      where: { id, organizationId },
    });
    
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    
    return this.prisma.employees.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, organizationId: string) {
    if (id === AUTOMATED_EMPLOYEE_ID) {
      throw new BadRequestException('El empleado automatizado no puede ser eliminado');
    }

    const existing = await this.prisma.employees.findFirst({
      where: { id, organizationId },
    });
    
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    
    // Verificar si es el primer empleado de la organización
    const firstEmployee = await this.prisma.employees.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    
    if (firstEmployee && firstEmployee.id === id) {
      throw new NotFoundException(`Cannot delete the first employee of the organization`);
    }
    
    await this.prisma.employees.delete({
      where: { id },
    });
    
    return { success: true };
  }
}
