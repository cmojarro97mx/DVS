import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BackblazeService } from '../../common/backblaze.service';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private backblaze: BackblazeService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.files.findMany({
      where: {
        organizationId,
      },
      include: {
        file_folders: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const file = await this.prisma.files.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        file_folders: true,
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
      const folder = await this.prisma.file_folders.findFirst({
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
    const createdFile = await this.prisma.files.create({
      data: {
        id: randomUUID(),
        name: file.originalname,
        url,
        storageKey: key,
        size: file.size,
        mimeType: file.mimetype,
        updatedAt: new Date(),
        ...(folderId ? { file_folders: { connect: { id: folderId } } } : {}),
        organizations: { connect: { id: organizationId } },
      },
      include: {
        file_folders: true,
      },
    });

    console.log('[FilesService] File record created:', createdFile.id);
    return createdFile;
  }

  async remove(id: string, organizationId: string) {
    const file = await this.findOne(id, organizationId);

    await this.backblaze.deleteFile(file.storageKey);

    return this.prisma.files.delete({ where: { id } });
  }

  async getAllOrganizationFiles(organizationId: string) {
    console.log('[FilesService] getAllOrganizationFiles - Starting');
    
    // Get files from Files table
    const files = await this.prisma.files.findMany({
      where: { organizationId },
      include: {
        file_folders: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('[FilesService] Found', files.length, 'general files');

    // Get operation documents
    const documents = await this.prisma.documents.findMany({
      where: {
        operationId: {
          not: null,
        },
        operations: {
          organizationId,
        },
      },
      include: {
        operations: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('[FilesService] Found', documents.length, 'operation documents');

    // Get email attachments and HTML content stored in Backblaze
    const emailMessages = await this.prisma.email_messages.findMany({
      where: {
        email_accounts: {
          users: {
            organizationId,
          },
        },
        OR: [
          { htmlBodyKey: { not: null } },
          { attachmentsKey: { not: null } },
        ],
      },
      select: {
        id: true,
        subject: true,
        htmlBodyKey: true,
        htmlBodyUrl: true,
        attachmentsKey: true,
        attachmentsData: true,
        createdAt: true,
        updatedAt: true,
        from: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('[FilesService] Found', emailMessages.length, 'email messages with attachments/HTML');

    // Process email files
    const emailFiles = [];
    let htmlCount = 0;
    let attachmentCount = 0;
    let skippedHtml = 0;
    let skippedAttachments = 0;
    
    // Sample first email for debugging
    if (emailMessages.length > 0) {
      const sample = emailMessages[0];
      console.log('[FilesService] Sample email:', {
        hasHtmlBodyKey: !!sample.htmlBodyKey,
        hasHtmlBodyUrl: !!sample.htmlBodyUrl,
        hasAttachmentsKey: !!sample.attachmentsKey,
        hasAttachmentsData: !!sample.attachmentsData,
        attachmentsDataType: typeof sample.attachmentsData,
        attachmentsDataIsArray: Array.isArray(sample.attachmentsData),
      });
    }
    
    // Generate signed URLs for all email files in parallel
    const urlPromises = [];
    for (const email of emailMessages) {
      // Add HTML body file if exists
      if (email.htmlBodyKey) {
        htmlCount++;
        urlPromises.push(
          this.backblaze.getSignedUrl(email.htmlBodyKey, 7200).then((url) => ({
            id: `email-html-${email.id}`,
            name: `${email.subject || 'Sin asunto'}.html`,
            url,
            storageKey: email.htmlBodyKey,
            size: 0,
            mimeType: 'text/html',
            preview: null,
            createdAt: email.createdAt,
            updatedAt: email.updatedAt,
            source: 'emails' as const,
            folder: null,
            operationReference: null,
            emailReference: `De: ${email.from}`,
          }))
        );
      }

      // Add attachments if exist
      if (email.attachmentsData && Array.isArray(email.attachmentsData)) {
        for (const attachment of email.attachmentsData as any[]) {
          if (attachment.b2Key) {
            attachmentCount++;
            urlPromises.push(
              this.backblaze.getSignedUrl(attachment.b2Key, 7200).then((url) => ({
                id: `email-attachment-${email.id}-${attachment.filename}`,
                name: attachment.filename || 'attachment',
                url,
                storageKey: attachment.b2Key,
                size: attachment.size || 0,
                mimeType: attachment.mimeType || 'application/octet-stream',
                preview: null,
                createdAt: email.createdAt,
                updatedAt: email.updatedAt,
                source: 'emails' as const,
                folder: null,
                operationReference: null,
                emailReference: `De: ${email.from}`,
              }))
            );
          } else {
            skippedAttachments++;
          }
        }
      }
    }
    
    // Wait for all signed URLs to be generated
    const emailFilesResolved = await Promise.all(urlPromises);
    emailFiles.push(...emailFilesResolved);
    
    console.log('[FilesService] Email files breakdown:', {
      htmlFiles: htmlCount,
      attachmentFiles: attachmentCount,
      skippedHtml,
      skippedAttachments,
      total: emailFiles.length
    });

    // Transform to unified format
    const unifiedFiles = [
      ...files.map((file) => ({
        id: file.id,
        name: file.name,
        url: file.url,
        storageKey: file.storageKey,
        size: file.size,
        mimeType: file.mimeType,
        preview: file.preview,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        source: 'files' as const,
        folder: file.file_folders,
        operationReference: null,
        emailReference: null,
      })),
      ...documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        url: doc.url || '',
        storageKey: doc.url || '', // Documents store URL directly
        size: doc.size || 0,
        mimeType: doc.mimeType || 'application/octet-stream',
        preview: null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        source: 'operations' as const,
        folder: null,
        operationReference: doc.operations?.projectName || null,
        emailReference: null,
      })),
      ...emailFiles,
    ];

    // Sort by creation date
    unifiedFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log('[FilesService] Returning total of', unifiedFiles.length, 'unified files');
    return unifiedFiles;
  }

  async getFileStats(organizationId: string) {
    const files = await this.prisma.files.findMany({
      where: { organizationId },
      select: {
        size: true,
        mimeType: true,
      },
    });

    const documents = await this.prisma.documents.findMany({
      where: {
        operations: {
          organizationId,
        },
      },
      select: {
        size: true,
        mimeType: true,
      },
    });

    // Get email files statistics
    const emailMessages = await this.prisma.email_messages.findMany({
      where: {
        email_accounts: {
          users: {
            organizationId,
          },
        },
        OR: [
          { htmlBodyKey: { not: null } },
          { attachmentsKey: { not: null } },
        ],
      },
      select: {
        htmlBodyKey: true,
        attachmentsData: true,
      },
    });

    // Count email files
    let emailFilesCount = 0;
    let emailFilesSize = 0;
    const emailFileTypes = [];

    for (const email of emailMessages) {
      if (email.htmlBodyKey) {
        emailFilesCount++;
        emailFileTypes.push({ mimeType: 'text/html', size: 0 });
      }
      if (email.attachmentsData && Array.isArray(email.attachmentsData)) {
        for (const attachment of email.attachmentsData as any[]) {
          if (attachment.b2Key) {
            emailFilesCount++;
            emailFilesSize += attachment.size || 0;
            emailFileTypes.push({ 
              mimeType: attachment.mimeType || 'application/octet-stream',
              size: attachment.size || 0,
            });
          }
        }
      }
    }

    const allFiles = [...files, ...documents, ...emailFileTypes];
    const totalSize = allFiles.reduce((acc, file) => acc + (file.size || 0), 0);
    const totalCount = allFiles.length;

    // Group by mime type
    const typeStats = allFiles.reduce((acc, file) => {
      const category = this.getFileCategory(file.mimeType);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSize,
      totalCount,
      typeStats,
      filesCount: files.length,
      documentsCount: documents.length,
      emailFilesCount,
    };
  }

  private getFileCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.includes('pdf')) return 'pdfs';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'documents';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheets';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archives';
    return 'others';
  }

  async createFolder(name: string, parentId: string | undefined, organizationId: string) {
    if (parentId) {
      const parent = await this.prisma.file_folders.findFirst({
        where: {
          id: parentId,
          organizationId,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    return this.prisma.file_folders.create({
      data: {
        id: randomUUID(),
        updatedAt: new Date(),
        name,
        parentId: parentId || null,
        organizationId,
      },
    });
  }

  async getFolders(organizationId: string) {
    return this.prisma.file_folders.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteFolder(id: string, organizationId: string) {
    const folder = await this.prisma.file_folders.findFirst({
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

    return this.prisma.file_folders.delete({ where: { id } });
  }
}
