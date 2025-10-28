import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';
import { EmailStorageService } from '../email-storage/email-storage.service';
import { AIClassifierService } from './ai-classifier.service';

@Injectable()
export class EmailExtractionService {
  private readonly logger = new Logger(EmailExtractionService.name);

  constructor(
    private prisma: PrismaService,
    private backblaze: BackblazeService,
    private emailStorage: EmailStorageService,
    private aiClassifier: AIClassifierService,
  ) {}

  async extractAttachmentsFromEmail(
    emailMessageId: string,
    operationId: string,
    folderId?: string,
  ): Promise<void> {
    const email = await this.prisma.email_messages.findUnique({
      where: { id: emailMessageId },
    });

    if (!email || !email.hasAttachments || !email.attachmentsData) {
      this.logger.log(`No attachments found for email ${emailMessageId}`);
      return;
    }

    const operation = await this.prisma.operations.findUnique({
      where: { id: operationId },
      include: { organizations: true },
    });

    if (!operation) {
      this.logger.warn(`Operation ${operationId} not found`);
      return;
    }

    const config = operation.organizationId
      ? await this.aiClassifier.getAutomationConfig(operation.organizationId)
      : null;

    if (!config || !config.enabled || !config.autoExtractFromEmails) {
      this.logger.log(
        `Auto-extraction disabled for organization ${operation.organizationId}`,
      );
      return;
    }

    const attachments = Array.isArray(email.attachmentsData)
      ? email.attachmentsData
      : JSON.parse(email.attachmentsData as any);

    for (const attachment of attachments as any[]) {
      try {
        await this.extractSingleAttachment(
          attachment,
          emailMessageId,
          operationId,
          folderId,
          config,
        );
      } catch (error) {
        this.logger.error(
          `Failed to extract attachment ${attachment.filename}: ${error.message}`,
        );
      }
    }
  }

  private async extractSingleAttachment(
    attachment: any,
    emailMessageId: string,
    operationId: string,
    folderId: string | undefined,
    config: any,
  ): Promise<void> {
    const existing = await this.prisma.documents.findFirst({
      where: {
        operationId,
        emailMessageId,
        name: attachment.filename,
      },
    });

    if (existing) {
      this.logger.log(
        `Attachment ${attachment.filename} already extracted, skipping`,
      );
      return;
    }

    const attachmentBuffer = await this.emailStorage.downloadAttachment(
      attachment.key,
    );

    const folderPath = `operations/${operationId}`;
    const { url, key } = await this.backblaze.uploadBuffer(
      attachmentBuffer,
      attachment.filename,
      attachment.mimeType || 'application/octet-stream',
      folderPath,
    );

    const document = await this.prisma.documents.create({
      data: {
        name: attachment.filename,
        type: 'file',
        url,
        b2Key: key,
        size: attachment.size || attachmentBuffer.length,
        mimeType: attachment.mimeType,
        operationId,
        parentId: folderId,
        emailMessageId,
        uploadedBy: 'auto',
      },
    });

    this.logger.log(
      `Extracted attachment ${attachment.filename} to document ${document.id}`,
    );

    if (config.autoClassify) {
      const classification = await this.aiClassifier.classifyDocument(
        attachment.filename,
        attachment.mimeType || 'application/octet-stream',
      );

      if (classification.confidence >= config.minConfidenceScore) {
        if (config.excludeSpam && classification.category === 'spam') {
          this.logger.log(`Deleting spam document: ${attachment.filename}`);
          await this.prisma.documents.delete({ where: { id: document.id } });
          if (key) {
            await this.backblaze.deleteFile(key);
          }
          return;
        }

        await this.prisma.documents.update({
          where: { id: document.id },
          data: {
            autoClassified: true,
            classifiedAs: classification.category,
            classificationScore: classification.confidence,
            metadata: {
              classificationReasoning: classification.reasoning,
            },
          },
        });

        this.logger.log(
          `Classified ${attachment.filename} as ${classification.category} (confidence: ${classification.confidence})`,
        );

        if (config.autoOrganize && config.targetFolderRules) {
          await this.autoOrganizeDocument(
            document.id,
            classification.category,
            config.targetFolderRules,
            operationId,
          );
        }
      }
    }
  }

  private async autoOrganizeDocument(
    documentId: string,
    category: string,
    rules: any,
    operationId: string,
  ): Promise<void> {
    try {
      const folderName = rules[category];
      if (!folderName) {
        return;
      }

      let folder = await this.prisma.documents.findFirst({
        where: {
          operationId,
          name: folderName,
          type: 'folder',
          parentId: null,
        },
      });

      if (!folder) {
        folder = await this.prisma.documents.create({
          data: {
            name: folderName,
            type: 'folder',
            operationId,
            uploadedBy: 'auto',
          },
        });
        this.logger.log(`Created auto-organization folder: ${folderName}`);
      }

      await this.prisma.documents.update({
        where: { id: documentId },
        data: { parentId: folder.id },
      });

      this.logger.log(
        `Moved document ${documentId} to folder ${folderName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to auto-organize document: ${error.message}`);
    }
  }

  async processOperationEmailAttachments(operationId: string): Promise<void> {
    const operation = await this.prisma.operations.findUnique({
      where: { id: operationId },
      include: {
        email_messages: {
          where: { hasAttachments: true },
        },
      },
    });

    if (!operation) {
      return;
    }

    for (const email of operation.email_messages) {
      await this.extractAttachmentsFromEmail(email.id, operationId);
    }
  }
}
