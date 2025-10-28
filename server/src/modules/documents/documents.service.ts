import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private backblaze: BackblazeService,
  ) {}

  async createFolder(operationId: string, name: string, parentId?: string) {
    const operation = await this.prisma.operations.findUnique({
      where: { id: operationId },
    });

    if (!operation) {
      throw new NotFoundException('Operation not found');
    }

    if (parentId) {
      const parent = await this.prisma.documents.findFirst({
        where: { id: parentId, operationId, type: 'folder' },
      });
      if (!parent) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    const folder = await this.prisma.documents.create({
      data: {
        name,
        type: 'folder',
        operationId,
        parentId,
        uploadedBy: 'manual',
      },
    });

    return folder;
  }

  async uploadFile(
    operationId: string,
    file: Express.Multer.File,
    folderId?: string,
    emailMessageId?: string,
  ) {
    const operation = await this.prisma.operations.findUnique({
      where: { id: operationId },
    });

    if (!operation) {
      throw new NotFoundException('Operation not found');
    }

    if (folderId) {
      const folder = await this.prisma.documents.findFirst({
        where: { id: folderId, operationId, type: 'folder' },
      });
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
    }

    const folderPath = `operations/${operationId}`;
    const { url, key } = await this.backblaze.uploadFile(file, folderPath);

    const document = await this.prisma.documents.create({
      data: {
        name: file.originalname,
        type: 'file',
        url,
        b2Key: key,
        size: file.size,
        mimeType: file.mimetype,
        operationId,
        parentId: folderId,
        emailMessageId,
        uploadedBy: emailMessageId ? 'auto' : 'manual',
      },
    });

    return document;
  }

  async getDocumentStructure(operationId: string) {
    const documents = await this.prisma.documents.findMany({
      where: { operationId },
      orderBy: [
        { type: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const buildTree = (parentId: string | null = null): any[] => {
      return documents
        .filter((doc) => doc.parentId === parentId)
        .map((doc) => ({
          ...doc,
          children: doc.type === 'folder' ? buildTree(doc.id) : undefined,
        }));
    };

    return buildTree();
  }

  async deleteDocument(id: string, operationId: string) {
    const document = await this.prisma.documents.findFirst({
      where: { id, operationId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.type === 'folder') {
      const children = await this.prisma.documents.findMany({
        where: { parentId: id },
      });

      for (const child of children) {
        await this.deleteDocument(child.id, operationId);
      }
    }

    if (document.type === 'file' && document.b2Key) {
      try {
        await this.backblaze.deleteFile(document.b2Key);
      } catch (error) {
        console.error('Error deleting file from B2:', error);
      }
    }

    await this.prisma.documents.delete({
      where: { id },
    });

    return { success: true };
  }

  async getDownloadUrl(id: string, operationId: string): Promise<string> {
    const document = await this.prisma.documents.findFirst({
      where: { id, operationId, type: 'file' },
    });

    if (!document || !document.b2Key) {
      throw new NotFoundException('Document not found');
    }

    return this.backblaze.getSignedUrl(document.b2Key);
  }

  async moveDocument(id: string, operationId: string, newParentId?: string) {
    const document = await this.prisma.documents.findFirst({
      where: { id, operationId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (newParentId) {
      const newParent = await this.prisma.documents.findFirst({
        where: { id: newParentId, operationId, type: 'folder' },
      });
      if (!newParent) {
        throw new NotFoundException('Target folder not found');
      }

      if (document.type === 'folder') {
        let currentParent = newParent;
        while (currentParent) {
          if (currentParent.id === id) {
            throw new BadRequestException('Cannot move folder into itself or its descendants');
          }
          if (!currentParent.parentId) break;
          currentParent = await this.prisma.documents.findUnique({
            where: { id: currentParent.parentId },
          }) as any;
        }
      }
    }

    const updated = await this.prisma.documents.update({
      where: { id },
      data: { parentId: newParentId },
    });

    return updated;
  }

  async renameDocument(id: string, operationId: string, newName: string) {
    const document = await this.prisma.documents.findFirst({
      where: { id, operationId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updated = await this.prisma.documents.update({
      where: { id },
      data: { name: newName },
    });

    return updated;
  }

  async getDocumentsByClassification(operationId: string, classification: string) {
    return this.prisma.documents.findMany({
      where: {
        operationId,
        classifiedAs: classification,
        type: 'file',
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
