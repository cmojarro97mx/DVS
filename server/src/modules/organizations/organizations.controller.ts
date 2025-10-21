import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

class UpdateOrganizationDto {
  name?: string;
  rfc?: string;
  taxRegime?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  website?: string;
}

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('current')
  async getCurrentOrganization(@Request() req) {
    return this.organizationsService.getOrganization(req.user.organizationId);
  }

  @Put('current')
  async updateCurrentOrganization(
    @Request() req,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(
      req.user.organizationId,
      updateDto,
    );
  }
}
