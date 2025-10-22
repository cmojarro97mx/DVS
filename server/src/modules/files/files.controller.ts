import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { FilesService } from './files.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.filesService.findAll(req.user.organizationId);
  }

  @Get('folders')
  getFolders(@Req() req: any) {
    return this.filesService.getFolders(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.filesService.findOne(id, req.user.organizationId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId: string | undefined,
    @Req() req: any,
  ) {
    console.log('[FilesController] Upload request received');
    console.log('[FilesController] File:', file ? { name: file.originalname, size: file.size, mimetype: file.mimetype } : 'NO FILE');
    console.log('[FilesController] FolderId:', folderId);
    console.log('[FilesController] User:', req.user?.id);
    console.log('[FilesController] Organization:', req.user?.organizationId);
    
    if (!file) {
      console.error('[FilesController] No file in request');
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.filesService.uploadFile(file, folderId, req.user.organizationId);
      console.log('[FilesController] Upload successful:', result.id);
      return result;
    } catch (error) {
      console.error('[FilesController] Upload failed:', error);
      throw error;
    }
  }

  @Post('folder')
  createFolder(
    @Body('name') name: string,
    @Body('parentId') parentId: string | undefined,
    @Req() req: any,
  ) {
    if (!name) {
      throw new BadRequestException('Folder name is required');
    }

    return this.filesService.createFolder(name, parentId, req.user.organizationId);
  }

  @Delete('folder/:id')
  deleteFolder(@Param('id') id: string, @Req() req: any) {
    return this.filesService.deleteFolder(id, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.filesService.remove(id, req.user.organizationId);
  }
}
