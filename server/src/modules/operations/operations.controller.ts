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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { OperationsService } from './operations.service';

@Controller('operations')
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get()
  findAll(@Request() req) {
    return this.operationsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.operationsService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() createData: any, @Request() req) {
    return this.operationsService.create(createData, req.user.organizationId, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Request() req) {
    return this.operationsService.update(id, updateData, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.operationsService.remove(id, req.user.organizationId);
  }

  @Get(':id/documents')
  getDocuments(@Param('id') id: string, @Request() req) {
    return this.operationsService.getDocuments(id, req.user.organizationId);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.operationsService.uploadDocument(id, file, req.user.organizationId);
  }

  @Delete(':id/documents/:documentId')
  deleteDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Request() req,
  ) {
    return this.operationsService.deleteDocument(documentId, id, req.user.organizationId);
  }

  @Put(':id/commissions')
  updateCommissionHistory(
    @Param('id') id: string,
    @Body() body: { commissionHistory: any },
    @Request() req,
  ) {
    return this.operationsService.updateCommissionHistory(
      id,
      body.commissionHistory,
      req.user.organizationId,
    );
  }
}
