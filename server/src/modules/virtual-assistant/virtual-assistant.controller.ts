import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VirtualAssistantService } from './virtual-assistant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('virtual-assistant')
@UseGuards(JwtAuthGuard)
export class VirtualAssistantController {
  constructor(private readonly assistantService: VirtualAssistantService) {}

  @Post()
  async create(@Request() req, @Body() body: { name?: string }) {
    return this.assistantService.createAssistant(
      req.user.userId,
      req.user.organizationId,
      body.name,
    );
  }

  @Get()
  async getAll(@Request() req) {
    return this.assistantService.getAssistantsByOrganization(
      req.user.organizationId,
    );
  }

  @Post(':id/toggle')
  async toggle(@Request() req, @Param('id') id: string) {
    return this.assistantService.toggleAssistant(id, req.user.organizationId);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    return this.assistantService.deleteAssistant(id, req.user.organizationId);
  }

  @Get('token/:token')
  async getByToken(@Param('token') token: string) {
    return this.assistantService.getAssistantByToken(token);
  }
}
