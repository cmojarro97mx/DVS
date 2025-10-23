import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VirtualAssistantService } from './virtual-assistant.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller('virtual-assistant')
export class VirtualAssistantController {
  constructor(private readonly assistantService: VirtualAssistantService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() body: { name?: string }) {
    return this.assistantService.createAssistant(
      req.user.userId,
      req.user.organizationId,
      body.name,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll(@Request() req) {
    return this.assistantService.getAssistantsByOrganization(
      req.user.organizationId,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      settings?: {
        welcomeMessage?: string;
        systemInstructions?: string;
        personality?: string;
      };
    },
  ) {
    return this.assistantService.updateAssistant(
      id,
      req.user.organizationId,
      body,
    );
  }

  @Post(':id/toggle')
  @UseGuards(JwtAuthGuard)
  async toggle(@Request() req, @Param('id') id: string) {
    return this.assistantService.toggleAssistant(id, req.user.organizationId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Request() req, @Param('id') id: string) {
    return this.assistantService.deleteAssistant(id, req.user.organizationId);
  }

  @Get('token/:token')
  async getByToken(@Param('token') token: string) {
    return this.assistantService.getAssistantByToken(token);
  }
}
