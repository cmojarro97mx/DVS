import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { SmartOperationCreatorService } from './smart-operation-creator.service';

@Injectable()
export class OperationLinkingRulesService {
  private readonly logger = new Logger(OperationLinkingRulesService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => SmartOperationCreatorService))
    private smartOperationCreator: SmartOperationCreatorService,
  ) {}

  async findAll(organizationId: string) {
    const rules = await this.prisma.operation_linking_rules.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    
    return rules.map(rule => ({
      ...rule,
      defaultAssigneeIds: Array.isArray(rule.defaultAssignees) ? rule.defaultAssignees : [],
      emailAccountIds: Array.isArray(rule.emailAccountIds) ? rule.emailAccountIds : [],
      autoCreate: rule.autoCreateOperations,
    }));
  }

  async findOne(id: string, organizationId: string) {
    const rule = await this.prisma.operation_linking_rules.findFirst({
      where: { id, organizationId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    return {
      ...rule,
      defaultAssigneeIds: Array.isArray(rule.defaultAssignees) ? rule.defaultAssignees : [],
      emailAccountIds: Array.isArray(rule.emailAccountIds) ? rule.emailAccountIds : [],
      autoCreate: rule.autoCreateOperations,
    };
  }

  async create(data: any, organizationId: string) {
    const { defaultAssigneeIds, emailAccountIds, autoCreate, processFromDate, ...rest } = data;
    
    this.logger.log(`📝 Creating rule with data:`, {
      processFromDate,
      autoCreate,
      hasEmailAccounts: emailAccountIds?.length > 0,
    });
    
    const rule = await this.prisma.operation_linking_rules.create({
      data: {
        ...rest,
        organizationId,
        defaultAssignees: defaultAssigneeIds || [],
        emailAccountIds: emailAccountIds || [],
        autoCreateOperations: autoCreate !== undefined ? autoCreate : true,
        processFromDate: processFromDate || null,
      },
    });

    // Process historical emails if processFromDate is set
    if (processFromDate) {
      this.logger.log(`⏳ Scheduling historical email processing for rule ${rule.id} from ${processFromDate}`);
      // Run in background to avoid blocking the response
      setImmediate(() => {
        this.processHistoricalEmails(rule.id, organizationId).catch(error => {
          this.logger.error(`Error processing historical emails for rule ${rule.id}:`, error);
        });
      });
    } else {
      this.logger.log(`⚠️ No processFromDate provided, skipping historical processing`);
    }

    return rule;
  }

  async update(id: string, data: any, organizationId: string) {
    // Check if exists
    const existing = await this.prisma.operation_linking_rules.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    const { defaultAssigneeIds, emailAccountIds, autoCreate, processFromDate, ...rest } = data;
    
    this.logger.log(`✏️ Updating rule ${id} with data:`, {
      processFromDate,
      autoCreate,
      hasEmailAccounts: emailAccountIds?.length > 0,
      existingProcessFromDate: existing.processFromDate,
    });
    
    const updateData: any = { ...rest };
    
    if (defaultAssigneeIds !== undefined) {
      updateData.defaultAssignees = defaultAssigneeIds;
    }
    
    if (emailAccountIds !== undefined) {
      updateData.emailAccountIds = emailAccountIds;
    }
    
    if (autoCreate !== undefined) {
      updateData.autoCreateOperations = autoCreate;
    }

    if (processFromDate !== undefined) {
      updateData.processFromDate = processFromDate;
    }

    const updated = await this.prisma.operation_linking_rules.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Process historical emails if processFromDate is set and changed
    // Convert both to Date objects for proper comparison
    const newDate = processFromDate ? new Date(processFromDate).getTime() : null;
    const oldDate = existing.processFromDate ? new Date(existing.processFromDate).getTime() : null;
    
    this.logger.log(`🔍 Comparing dates:`, {
      newDate,
      oldDate,
      areEqual: newDate === oldDate,
      willProcess: processFromDate && newDate !== oldDate,
    });
    
    if (processFromDate && newDate !== oldDate) {
      this.logger.log(`⏳ ProcessFromDate changed from ${existing.processFromDate} to ${processFromDate}, triggering historical processing`);
      // Run in background to avoid blocking the response
      setImmediate(() => {
        this.processHistoricalEmails(updated.id, organizationId).catch(error => {
          this.logger.error(`Error processing historical emails for rule ${updated.id}:`, error);
        });
      });
    } else {
      this.logger.log(`⚠️ No historical processing needed. ProcessFromDate: ${processFromDate}, Changed: ${newDate !== oldDate}`);
    }

    return updated;
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.operation_linking_rules.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    return this.prisma.operation_linking_rules.delete({
      where: { id: existing.id },
    });
  }

  async getEnabledRules(organizationId: string) {
    return this.prisma.operation_linking_rules.findMany({
      where: {
        organizationId,
        enabled: true,
      },
    });
  }

  async toggleRule(id: string, organizationId: string) {
    const rule = await this.prisma.operation_linking_rules.findFirst({
      where: { id, organizationId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    return this.prisma.operation_linking_rules.update({
      where: { id: rule.id },
      data: { enabled: !rule.enabled },
    });
  }

  async processHistoricalEmails(ruleId: string, organizationId: string) {
    const rule = await this.prisma.operation_linking_rules.findFirst({
      where: { id: ruleId, organizationId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (!rule.processFromDate) {
      this.logger.warn(`Rule ${ruleId} has no processFromDate set, skipping historical processing`);
      return { processed: 0, created: 0, errors: 0 };
    }

    this.logger.log(`Processing historical emails for rule ${rule.name} (${ruleId}) from ${rule.processFromDate}`);

    // Build query to find matching emails
    const whereConditions: any = {
      date: {
        gte: rule.processFromDate,
      },
      OR: [
        { subject: { contains: rule.subjectPattern, mode: 'insensitive' } },
        { body: { contains: rule.subjectPattern, mode: 'insensitive' } },
      ],
    };

    // Filter by email accounts if specified
    const emailAccountIds = Array.isArray(rule.emailAccountIds) ? rule.emailAccountIds : [];
    if (emailAccountIds.length > 0) {
      whereConditions.accountId = { in: emailAccountIds };
    }

    // Only process if not already processed (lastHistoricalProcessed)
    if (rule.lastHistoricalProcessed) {
      whereConditions.date.gte = rule.lastHistoricalProcessed;
    }

    const emails = await this.prisma.email_messages.findMany({
      where: whereConditions,
      orderBy: { date: 'asc' },
    });

    this.logger.log(`Found ${emails.length} historical emails to process for rule ${rule.name}`);

    let processed = 0;
    let created = 0;
    let errors = 0;
    let lastSuccessfulDate: Date | null = null;

    for (const email of emails) {
      try {
        this.logger.log(`Processing email ${email.id} - ${email.subject}`);
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
        
        processed++;
        lastSuccessfulDate = email.date;
        if (result) {
          created++;
          this.logger.log(`✅ Created operation: ${result.projectName}`);
        }
      } catch (error) {
        this.logger.error(`Error processing email ${email.id}: ${error.message}`, error.stack);
        errors++;
      }
    }

    // Only update lastHistoricalProcessed if no errors occurred
    // This allows manual retry to reprocess failed emails
    if (errors === 0 && lastSuccessfulDate) {
      await this.prisma.operation_linking_rules.update({
        where: { id: rule.id },
        data: { lastHistoricalProcessed: lastSuccessfulDate },
      });
      this.logger.log(`✅ Updated lastHistoricalProcessed to ${lastSuccessfulDate}`);
    } else if (errors > 0) {
      this.logger.warn(`⚠️ Errors occurred during processing, NOT updating lastHistoricalProcessed to allow retry`);
    }

    this.logger.log(`Historical processing complete for rule ${rule.name}: ${processed} processed, ${created} created, ${errors} errors`);

    return { processed, created, errors };
  }
}
