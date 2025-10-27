import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.clients.findMany({
      where: { organizationId },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.clients.findUnique({
      where: { id, organizationId },
    });
  }

  private mapClientData(data: any) {
    const mappedData: any = {};
    
    if (data.name !== undefined) mappedData.name = data.name;
    if (data.contactPerson !== undefined) mappedData.contactPerson = data.contactPerson;
    if (data.email !== undefined) mappedData.email = data.email;
    if (data.phone !== undefined) mappedData.phone = data.phone;
    if (data.address !== undefined) mappedData.address = data.address;
    if (data.status !== undefined) mappedData.status = data.status;
    if (data.currency !== undefined) mappedData.currency = data.currency;
    
    if (data.taxId !== undefined) mappedData.rfc = data.taxId;
    if (data.rfc !== undefined) mappedData.rfc = data.rfc;
    if (data.taxRegime !== undefined) mappedData.taxRegime = data.taxRegime;
    if (data.cfdiUse !== undefined) mappedData.cfdiUse = data.cfdiUse;
    if (data.taxAddress !== undefined) mappedData.taxAddress = data.taxAddress;
    if (data.postalCode !== undefined) mappedData.postalCode = data.postalCode;
    if (data.billingEmail !== undefined) mappedData.billingEmail = data.billingEmail;
    
    if (data.taxInfo && typeof data.taxInfo === 'object') {
      if (data.taxInfo.rfc !== undefined) mappedData.rfc = data.taxInfo.rfc;
      if (data.taxInfo.taxRegime !== undefined) mappedData.taxRegime = data.taxInfo.taxRegime;
      if (data.taxInfo.cfdiUse !== undefined) mappedData.cfdiUse = data.taxInfo.cfdiUse;
      if (data.taxInfo.taxAddress !== undefined) mappedData.taxAddress = data.taxInfo.taxAddress;
      if (data.taxInfo.postalCode !== undefined) mappedData.postalCode = data.taxInfo.postalCode;
      if (data.taxInfo.billingEmail !== undefined) mappedData.billingEmail = data.taxInfo.billingEmail;
    }
    
    if (data.organizationId !== undefined) {
      mappedData.organizations = {
        connect: { id: data.organizationId }
      };
    }
    
    return mappedData;
  }

  async create(data: any) {
    const mappedData = this.mapClientData(data);
    return this.prisma.clients.create({ data: mappedData });
  }

  async update(id: string, data: any, organizationId: string) {
    const mappedData = this.mapClientData(data);
    delete mappedData.organization;
    if (data.organizationId !== undefined) {
      mappedData.organizationId = data.organizationId;
    }
    return this.prisma.clients.update({
      where: { id, organizationId },
      data: mappedData,
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.clients.delete({
      where: { id, organizationId },
    });
  }
}
