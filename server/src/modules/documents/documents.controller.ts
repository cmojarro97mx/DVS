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

@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

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
}
