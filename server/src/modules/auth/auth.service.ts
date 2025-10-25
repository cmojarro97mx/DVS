import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string, organizationName: string) {
    if (!email || !password || !name || !organizationName) {
      throw new UnauthorizedException('Todos los campos son requeridos');
    }

    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Ya existe una cuenta con este correo electrónico');
    }

    if (password.length < 6) {
      throw new UnauthorizedException('La contraseña debe tener al menos 6 caracteres');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const organization = await this.prisma.organizations.create({
      data: {
        id: randomUUID(),
        name: organizationName,
        email: email,
        updatedAt: new Date(),
      },
    });

    const user = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        email,
        password: hashedPassword,
        name,
        role: 'admin',
        status: 'Active',
        updatedAt: new Date(),
        organizations: { connect: { id: organization.id } },
      },
      include: {
        organizations: true,
      },
    });

    await this.prisma.employees.create({
      data: {
        id: randomUUID(),
        name: user.name,
        email: user.email,
        role: 'CEO',
        status: 'Active',
        updatedAt: new Date(),
        users: { connect: { id: user.id } },
        organizations: { connect: { id: organization.id } },
        hireDate: new Date(),
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.organizationId);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
        organization: user.organizations,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: {
        organizations: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('No existe una cuenta con este correo electrónico');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('La contraseña es incorrecta');
    }

    if (user.status !== 'Active') {
      throw new UnauthorizedException('Esta cuenta está inactiva. Contacta al administrador');
    }

    await this.prisma.refresh_tokens.deleteMany({
      where: { userId: user.id },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.organizationId);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        phone: user.phone,
        avatar: user.avatar,
        organizationId: user.organizationId,
        organization: user.organizations,
      },
      ...tokens,
    };
  }

  async generateTokens(userId: string, email: string, organizationId: string) {
    const payload = { sub: userId, email, organizationId };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    await this.prisma.refresh_tokens.create({
      data: {
        id: randomUUID(),
        token: refreshToken,
        users: { connect: { id: userId } },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async validateUser(userId: string) {
    return this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        organizationId: true,
      },
    });
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token es requerido');
    }

    try {
      const payload = this.jwtService.verify(refreshToken);
      
      const storedToken = await this.prisma.refresh_tokens.findUnique({
        where: { token: refreshToken },
        include: { users: true },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      if (new Date() > storedToken.expiresAt) {
        await this.prisma.refresh_tokens.delete({ where: { id: storedToken.id } });
        throw new UnauthorizedException('Refresh token expirado');
      }

      if (storedToken.users.status !== 'Active') {
        throw new UnauthorizedException('Usuario inactivo');
      }

      await this.prisma.refresh_tokens.delete({ where: { id: storedToken.id } });

      const tokens = await this.generateTokens(
        storedToken.userId,
        storedToken.users.email,
        storedToken.users.organizationId,
      );

      return {
        user: {
          id: storedToken.users.id,
          email: storedToken.users.email,
          name: storedToken.users.name,
          role: storedToken.users.role,
          status: storedToken.users.status,
          organizationId: storedToken.users.organizationId,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return { message: 'Sesión cerrada exitosamente' };
    }

    try {
      await this.prisma.refresh_tokens.deleteMany({
        where: { token: refreshToken },
      });
      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      return { message: 'Sesión cerrada exitosamente' };
    }
  }
}
