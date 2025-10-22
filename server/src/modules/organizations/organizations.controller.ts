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
    @Body() updateDto: any,
  ) {
    console.log('🔵 UPDATE ORGANIZATION REQUEST RECEIVED');
    console.log('📋 Raw req.body:', req.body);
    console.log('📋 Request Body (updateDto):', JSON.stringify(updateDto, null, 2));
    console.log('👤 User Organization ID:', req.user.organizationId);
    
    const result = await this.organizationsService.updateOrganization(
      req.user.organizationId,
      updateDto,
    );
    
    console.log('✅ UPDATE SUCCESS - Result:', JSON.stringify(result, null, 2));
    return result;
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
