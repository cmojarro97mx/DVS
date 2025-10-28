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
import { SmartOperationCreatorService } from './smart-operation-creator.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { PrismaService } from '../../common/prisma.service';

@Controller('operation-linking-rules')
@UseGuards(JwtAuthGuard)
export class OperationLinkingRulesController {
  constructor(
    private readonly linkingRulesService: OperationLinkingRulesService,
    private readonly smartOperationCreator: SmartOperationCreatorService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('email-accounts')
  async getEmailAccounts(@Request() req) {
    const userId = req.user.userId;
    const accounts = await this.prisma.email_accounts.findMany({
      where: { userId },
      select: {
        id: true,
        email: true,
        provider: true,
        status: true,
        syncEmail: true,
      },
      orderBy: { email: 'asc' },
    });
    return accounts;
  }

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

  @Post('test/process-email/:emailId')
  async testProcessEmail(@Param('emailId') emailId: string, @Request() req) {
    const organizationId = req.user.organizationId;
    
    const email = await this.prisma.email_messages.findUnique({
      where: { id: emailId },
      include: { email_accounts: true },
    });

    if (!email) {
      throw new Error('Email not found');
    }

    const result = await this.smartOperationCreator.processEmailForOperationCreation(
      {
        id: email.id,
        subject: email.subject,
        from: email.from,
        bodyText: email.body,
        snippet: email.snippet,
        date: email.date,
      },
      organizationId,
      email.accountId,
    );

    return {
      success: true,
      result,
      email: {
        id: email.id,
        subject: email.subject,
        from: email.from,
      },
    };
  }
}
