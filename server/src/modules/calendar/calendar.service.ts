import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string, 
    organizationId: string, 
    filters?: {
      emailAccountIds?: string[];
      includeLocal?: boolean;
      status?: string;
    }
  ) {
    const where: any = {
      userId,
      organizationId,
    };

    // Handle multi-source filtering
    if (filters && (filters.emailAccountIds?.length || filters.includeLocal)) {
      const conditions = [];
      
      // Add email account IDs if specified
      if (filters.emailAccountIds && filters.emailAccountIds.length > 0) {
        conditions.push({
          emailAccountId: {
            in: filters.emailAccountIds,
          },
        });
      }
      
      // Add local events if specified
      if (filters.includeLocal) {
        conditions.push({
          emailAccountId: null,
        });
      }
      
      // Use OR to combine conditions
      if (conditions.length > 0) {
        where.OR = conditions;
      }
    }

    // Filter by status if provided (exclude deleted events by default)
    if (filters?.status) {
      where.status = filters.status;
    } else {
      where.status = {
        not: 'deleted',
      };
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
