import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, organizationId: string, emailAccountId?: string) {
    const where: any = {
      userId,
      organizationId,
    };

    // Filter by emailAccountId if provided
    // Special value 'local' means events without an associated email account
    if (emailAccountId) {
      if (emailAccountId === 'local') {
        where.emailAccountId = null;
      } else {
        where.emailAccountId = emailAccountId;
      }
    }

    return this.prisma.event.findMany({
      where,
      include: {
        emailAccount: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.event.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.event.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }
}
