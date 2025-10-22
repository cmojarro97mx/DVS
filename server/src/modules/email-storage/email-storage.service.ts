import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class EmailStorageService {
  private readonly logger = new Logger(EmailStorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('BACKBLAZE_ENDPOINT');
    const keyId = this.configService.get<string>('BACKBLAZE_KEY_ID');
    const applicationKey = this.configService.get<string>('BACKBLAZE_APPLICATION_KEY');
    this.bucketName = this.configService.get<string>('BACKBLAZE_BUCKET_NAME');

    this.s3Client = new S3Client({
      endpoint: `https://${endpoint}`,
      region: 'us-west-002',
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: applicationKey,
      },
    });
  }

  async uploadEmailHtml(accountId: string, messageId: string, htmlContent: string): Promise<string> {
    const key = `emails/${accountId}/${messageId}/body.html`;
    
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: htmlContent,
          ContentType: 'text/html',
        })
      );
      
      this.logger.log(`Uploaded HTML for message ${messageId} to ${key}`);
      return key;
    } catch (error) {
      this.logger.error(`Failed to upload HTML for message ${messageId}:`, error);
      throw error;
    }
  }

  async uploadAttachment(
    accountId: string,
    messageId: string,
    attachmentId: string,
    data: Buffer,
    mimeType: string,
    filename: string
  ): Promise<string> {
    const key = `emails/${accountId}/${messageId}/attachments/${attachmentId}/${filename}`;
    
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: data,
          ContentType: mimeType,
          ContentDisposition: `attachment; filename="${filename}"`,
        })
      );
      
      this.logger.log(`Uploaded attachment ${filename} to ${key}`);
      return key;
    } catch (error) {
      this.logger.error(`Failed to upload attachment ${filename}:`, error);
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}:`, error);
      throw error;
    }
  }

  async uploadAttachments(
    accountId: string,
    messageId: string,
    attachments: Array<{
      id: string;
      filename: string;
      mimeType: string;
      data: Buffer;
      size: number;
    }>
  ): Promise<Array<{ id: string; key: string; filename: string; size: number; mimeType: string }>> {
    const uploadedAttachments = [];
    
    for (const attachment of attachments) {
      const key = await this.uploadAttachment(
        accountId,
        messageId,
        attachment.id,
        attachment.data,
        attachment.mimeType,
        attachment.filename
      );
      
      uploadedAttachments.push({
        id: attachment.id,
        key,
        filename: attachment.filename,
        size: attachment.size,
        mimeType: attachment.mimeType,
      });
    }
    
    return uploadedAttachments;
  }
}
