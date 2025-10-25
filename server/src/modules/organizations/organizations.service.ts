import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private backblaze: BackblazeService,
  ) {}

  async getOrganization(organizationId: string) {
    const organization = await this.prisma.organizations.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async updateOrganization(organizationId: string, data: any) {
    return this.prisma.organizations.update({
      where: { id: organizationId },
      data,
    });
  }

  async uploadLogo(organizationId: string, file: Express.Multer.File) {
    const { url } = await this.backblaze.uploadFile(file, organizationId);

    const organization = await this.prisma.organizations.update({
      where: { id: organizationId },
      data: { logo: url },
    });

    return organization;
  }
}
