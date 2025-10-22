import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private backblaze: BackblazeService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.file.findMany({
      where: {
        organizationId,
      },
      include: {
        folder: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        folder: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async uploadFile(
    file: Express.Multer.File,
    folderId: string | undefined,
    organizationId: string,
  ) {
    console.log('[FilesService] uploadFile called');
    console.log('[FilesService] File:', file.originalname, file.size, 'bytes');
    console.log('[FilesService] FolderId:', folderId);
    console.log('[FilesService] OrganizationId:', organizationId);
    
    if (folderId) {
      console.log('[FilesService] Validating folder...');
      const folder = await this.prisma.fileFolder.findFirst({
        where: {
          id: folderId,
          organizationId,
        },
      });

      if (!folder) {
        console.error('[FilesService] Folder not found:', folderId);
        throw new NotFoundException('Folder not found');
      }
      console.log('[FilesService] Folder validated:', folder.name);
    }

    // Create proper folder path: organizations/{organizationId}/files/{folderId}
    let folderPath = `organizations/${organizationId}/files`;
    if (folderId) {
      folderPath = `${folderPath}/${folderId}`;
    }
    console.log('[FilesService] Upload path:', folderPath);

    console.log('[FilesService] Uploading to Backblaze...');
    const { url, key } = await this.backblaze.uploadFile(file, folderPath);
    console.log('[FilesService] Backblaze upload successful. URL:', url);

    console.log('[FilesService] Saving file record to database...');
    const createdFile = await this.prisma.file.create({
      data: {
        name: file.originalname,
        url,
        storageKey: key,
        size: file.size,
        mimeType: file.mimetype,
        folderId: folderId || null,
        organizationId,
      },
      include: {
        folder: true,
      },
    });

    console.log('[FilesService] File record created:', createdFile.id);
    return createdFile;
  }

  async remove(id: string, organizationId: string) {
    const file = await this.findOne(id, organizationId);

    await this.backblaze.deleteFile(file.storageKey);

    return this.prisma.file.delete({ where: { id } });
  }

  async createFolder(name: string, parentId: string | undefined, organizationId: string) {
    if (parentId) {
      const parent = await this.prisma.fileFolder.findFirst({
        where: {
          id: parentId,
          organizationId,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    return this.prisma.fileFolder.create({
      data: {
        name,
        parentId: parentId || null,
        organizationId,
      },
    });
  }

  async getFolders(organizationId: string) {
    return this.prisma.fileFolder.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteFolder(id: string, organizationId: string) {
    const folder = await this.prisma.fileFolder.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        files: true,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    for (const file of folder.files) {
      await this.remove(file.id, organizationId);
    }

    return this.prisma.fileFolder.delete({ where: { id } });
  }
}
