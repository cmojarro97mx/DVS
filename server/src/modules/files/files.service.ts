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
        folder: {
          OR: [
            { organizationId },
            { organizationId: null },
          ],
        },
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
        folder: {
          OR: [
            { organizationId },
            { organizationId: null },
          ],
        },
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
    if (folderId) {
      const folder = await this.prisma.fileFolder.findFirst({
        where: {
          id: folderId,
          organizationId,
        },
      });

      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
    }

    const { url, key } = await this.backblaze.uploadFile(file, organizationId);

    const createdFile = await this.prisma.file.create({
      data: {
        name: file.originalname,
        url,
        size: file.size,
        mimeType: file.mimetype,
        folderId: folderId || null,
      },
      include: {
        folder: true,
      },
    });

    return createdFile;
  }

  async remove(id: string, organizationId: string) {
    const file = await this.findOne(id, organizationId);

    const urlParts = file.url.split('/');
    const key = urlParts.slice(urlParts.indexOf(organizationId)).join('/');

    try {
      await this.backblaze.deleteFile(key);
    } catch (error) {
      console.error('Error deleting file from Backblaze:', error);
    }

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
