import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OperationLinkingRulesService } from './operation-linking-rules.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller('operation-linking-rules')
@UseGuards(JwtAuthGuard)
export class OperationLinkingRulesController {
  constructor(
    private readonly linkingRulesService: OperationLinkingRulesService,
  ) {}

  @Get()
  async findAll(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.linkingRulesService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.linkingRulesService.findOne(id, organizationId);
  }

  @Post()
  async create(@Body() createDto: any, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.linkingRulesService.create(createDto, organizationId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req,
  ) {
    const organizationId = req.user.organizationId;
    return this.linkingRulesService.update(id, updateDto, organizationId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.linkingRulesService.remove(id, organizationId);
  }

  @Post(':id/toggle')
  async toggle(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.linkingRulesService.toggleRule(id, organizationId);
  }
}
