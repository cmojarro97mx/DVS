import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service';
import * as bcrypt from 'bcrypt';

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

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Ya existe una cuenta con este correo electrónico');
    }

    if (password.length < 6) {
      throw new UnauthorizedException('La contraseña debe tener al menos 6 caracteres');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const organization = await this.prisma.organization.create({
      data: {
        name: organizationName,
        email: email,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'admin',
        status: 'Active',
        organizationId: organization.id,
      },
      include: {
        organization: true,
      },
    });

    await this.prisma.employee.create({
      data: {
        name: user.name,
        email: user.email,
        role: 'CEO',
        status: 'Active',
        userId: user.id,
        organizationId: organization.id,
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
        organization: user.organization,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
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
        organization: user.organization,
      },
      ...tokens,
    };
  }

  async generateTokens(userId: string, email: string, organizationId: string) {
    const payload = { sub: userId, email, organizationId };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
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
      
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      if (new Date() > storedToken.expiresAt) {
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new UnauthorizedException('Refresh token expirado');
      }

      if (storedToken.user.status !== 'Active') {
        throw new UnauthorizedException('Usuario inactivo');
      }

      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

      const tokens = await this.generateTokens(
        storedToken.userId,
        storedToken.user.email,
        storedToken.user.organizationId,
      );

      return {
        user: {
          id: storedToken.user.id,
          email: storedToken.user.email,
          name: storedToken.user.name,
          role: storedToken.user.role,
          status: storedToken.user.status,
          organizationId: storedToken.user.organizationId,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }
}
