import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SystemEmployeeService {
  private readonly logger = new Logger(SystemEmployeeService.name);
  private readonly SYSTEM_EMPLOYEE_EMAIL = 'automation@nexxio.system';
  private readonly SYSTEM_EMPLOYEE_NAME = 'Automatización';

  constructor(private prisma: PrismaService) {}

  async getOrCreateSystemEmployee(organizationId: string) {
    // Buscar empleado del sistema existente para esta organización
    let systemEmployee = await this.prisma.employee.findFirst({
      where: {
        organizationId,
        isSystemUser: true,
      },
      include: {
        user: true,
      },
    });

    if (systemEmployee) {
      return systemEmployee;
    }

    // No existe, crear el empleado del sistema
    this.logger.log(`Creando empleado del sistema para organización ${organizationId}...`);

    // Primero crear el usuario del sistema
    const hashedPassword = await bcrypt.hash(uuidv4(), 10);
    const systemUser = await this.prisma.user.create({
      data: {
        id: uuidv4(),
        email: `automation-${organizationId}@nexxio.system`,
        password: hashedPassword,
        name: this.SYSTEM_EMPLOYEE_NAME,
        role: 'system',
        status: 'Active',
        organizationId,
      },
    });

    // Crear el empleado vinculado al usuario
    systemEmployee = await this.prisma.employee.create({
      data: {
        id: uuidv4(),
        name: this.SYSTEM_EMPLOYEE_NAME,
        email: systemUser.email,
        role: 'Sistema',
        status: 'Active',
        department: 'Sistema',
        isSystemUser: true,
        organizationId,
        userId: systemUser.id,
      },
      include: {
        user: true,
      },
    });

    this.logger.log(`✅ Empleado del sistema creado: ${systemEmployee.id}`);
    return systemEmployee;
  }

  async getSystemEmployeeUserId(organizationId: string): Promise<string> {
    const systemEmployee = await this.getOrCreateSystemEmployee(organizationId);
    if (!systemEmployee.userId) {
      throw new Error('System employee does not have a user ID');
    }
    return systemEmployee.userId;
  }

  async isSystemEmployee(employeeId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { isSystemUser: true },
    });
    return employee?.isSystemUser || false;
  }
}
