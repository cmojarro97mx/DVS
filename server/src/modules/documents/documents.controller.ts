import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { AIClassifierService } from './ai-classifier.service';
import { EmailExtractionService } from './email-extraction.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private documentsService: DocumentsService,
    private aiClassifier: AIClassifierService,
    private emailExtraction: EmailExtractionService,
  ) {}

  @Post('folders')
  async createFolder(@Body() body: { operationId: string; name: string; parentId?: string }) {
    return this.documentsService.createFolder(body.operationId, body.name, body.parentId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { operationId: string; folderId?: string; emailMessageId?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.documentsService.uploadFile(body.operationId, file, body.folderId, body.emailMessageId);
  }

  @Get('operation/:operationId')
  async getDocumentStructure(@Param('operationId') operationId: string) {
    return this.documentsService.getDocumentStructure(operationId);
  }

  @Get('operation/:operationId/classification/:classification')
  async getDocumentsByClassification(
    @Param('operationId') operationId: string,
    @Param('classification') classification: string,
  ) {
    return this.documentsService.getDocumentsByClassification(operationId, classification);
  }

  @Get(':id/download')
  async getDownloadUrl(
    @Param('id') id: string,
    @Query('operationId') operationId: string,
  ) {
    if (!operationId) {
      throw new BadRequestException('operationId is required');
    }
    const url = await this.documentsService.getDownloadUrl(id, operationId);
    return { url };
  }

  @Delete(':id')
  async deleteDocument(
    @Param('id') id: string,
    @Query('operationId') operationId: string,
  ) {
    if (!operationId) {
      throw new BadRequestException('operationId is required');
    }
    return this.documentsService.deleteDocument(id, operationId);
  }

  @Patch(':id/move')
  async moveDocument(
    @Param('id') id: string,
    @Body() body: { operationId: string; newParentId?: string },
  ) {
    return this.documentsService.moveDocument(id, body.operationId, body.newParentId);
  }

  @Patch(':id/rename')
  async renameDocument(
    @Param('id') id: string,
    @Body() body: { operationId: string; newName: string },
  ) {
    return this.documentsService.renameDocument(id, body.operationId, body.newName);
  }

  @Post(':id/classify')
  async classifyDocument(@Param('id') id: string) {
    await this.aiClassifier.classifyAndUpdateDocument(id);
    return { success: true };
  }

  @Post('operation/:operationId/batch-classify')
  async batchClassify(@Param('operationId') operationId: string) {
    await this.aiClassifier.batchClassifyDocuments(operationId);
    return { success: true };
  }

  @Get('automation/config/:organizationId')
  async getAutomationConfig(@Param('organizationId') organizationId: string) {
    return this.aiClassifier.getAutomationConfig(organizationId);
  }

  @Post('automation/config/:organizationId')
  async updateAutomationConfig(
    @Param('organizationId') organizationId: string,
    @Body() body: any,
  ) {
    return this.aiClassifier.updateAutomationConfig(organizationId, body);
  }

  @Post('extract-email-attachments')
  async extractEmailAttachments(
    @Body() body: { emailMessageId: string; operationId: string; folderId?: string },
  ) {
    await this.emailExtraction.extractAttachmentsFromEmail(
      body.emailMessageId,
      body.operationId,
      body.folderId,
    );
    return { success: true };
  }

  @Post('operation/:operationId/process-email-attachments')
  async processOperationEmailAttachments(@Param('operationId') operationId: string) {
    await this.emailExtraction.processOperationEmailAttachments(operationId);
    return { success: true };
  }
}
