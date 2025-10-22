import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  UseInterceptors, 
  UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('current/logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.organizationsService.uploadLogo(
      req.user.organizationId,
      file,
    );
  }
}
