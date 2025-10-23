import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import * as mime from 'mime-types';

@Injectable()
export class BackblazeService {
  private s3Client: S3Client;
  private bucketName: string;
  private endpoint: string;

  constructor() {
    const keyId = process.env.BACKBLAZE_KEY_ID?.trim();
    const appKey = process.env.BACKBLAZE_APPLICATION_KEY?.trim();
    this.bucketName = (process.env.BACKBLAZE_BUCKET_NAME || '').trim();
    this.endpoint = (process.env.BACKBLAZE_ENDPOINT || '').trim();

    if (!keyId || !appKey || !this.bucketName || !this.endpoint) {
      throw new Error('Backblaze B2 credentials are not configured properly');
    }

    this.s3Client = new S3Client({
      endpoint: `https://${this.endpoint}`,
      region: 'us-west-002',
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: appKey,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ url: string; key: string }> {
    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = folder
      ? `${folder}/${timestamp}-${sanitizedFilename}`
      : `${timestamp}-${sanitizedFilename}`;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || mime.lookup(file.originalname) || 'application/octet-stream',
      },
    });

    await upload.done();

    const url = `https://${this.endpoint}/file/${this.bucketName}/${key}`;

    return { url, key };
  }

  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folder?: string,
  ): Promise<{ url: string; key: string }> {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = folder
      ? `${folder}/${timestamp}-${sanitizedFilename}`
      : `${timestamp}-${sanitizedFilename}`;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      },
    });

    await upload.done();

    const url = `https://${this.endpoint}/file/${this.bucketName}/${key}`;

    return { url, key };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getFile(key: string): Promise<{ stream: Readable; contentType: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType || 'application/octet-stream',
    };
  }

  getPublicUrl(key: string): string {
    return `https://${this.endpoint}/file/${this.bucketName}/${key}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client as any, command, { expiresIn });
  }
}
