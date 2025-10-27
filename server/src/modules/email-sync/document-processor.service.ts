import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWorker } from 'tesseract.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private ocrWorker: any = null;
  private backblazeErrorCount: number = 0;
  private isBackblazePaused: boolean = false;
  private pausedUntil: Date | null = null;

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

  async initializeOCR() {
    if (!this.ocrWorker) {
      this.logger.log('Initializing Tesseract OCR worker...');
      this.ocrWorker = await createWorker('eng');
      this.logger.log('Tesseract OCR worker initialized');
    }
    return this.ocrWorker;
  }

  async terminateOCR() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }

  async processAttachment(attachment: any): Promise<string | null> {
    try {
      const mimeType = attachment.mimeType || attachment.contentType;
      const key = attachment.key || attachment.s3Key;
      const filename = attachment.filename;

      if (!key) {
        this.logger.warn(`Attachment ${filename} has no key, skipping`);
        return null;
      }

      if (mimeType === 'application/pdf') {
        return await this.extractTextFromPDF(key);
      } else if (mimeType?.startsWith('image/')) {
        return await this.extractTextFromImage(key);
      } else if (['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                   'text/csv', 'application/csv'].includes(mimeType)) {
        this.logger.log(`Skipping ${mimeType} file (spreadsheet/CSV): ${filename}`);
        return null;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error processing attachment: ${error.message}`, error.stack);
      return null;
    }
  }

  private async extractTextFromPDF(s3Key: string): Promise<string | null> {
    try {
      this.logger.log(`Extracting text from PDF: ${s3Key}`);
      
      const buffer = await this.downloadFromS3(s3Key);
      if (!buffer) return null;

      // pdf-parse requiere require() debido a su estructura de exportación
      const pdfParseModule = require('pdf-parse');
      const data = await pdfParseModule(buffer);
      const text = data.text.trim();
      
      this.logger.log(`Extracted ${text.length} characters from PDF ${s3Key}`);
      return text;
    } catch (error) {
      this.logger.error(`Error extracting text from PDF ${s3Key}: ${error.message}`);
      return null;
    }
  }

  private async extractTextFromImage(s3Key: string): Promise<string | null> {
    try {
      this.logger.log(`Performing OCR on image: ${s3Key}`);
      
      const buffer = await this.downloadFromS3(s3Key);
      if (!buffer) return null;

      const worker = await this.initializeOCR();
      const { data: { text } } = await worker.recognize(buffer);
      
      const cleanedText = text.trim();
      this.logger.log(`Extracted ${cleanedText.length} characters from image ${s3Key}`);
      
      return cleanedText;
    } catch (error) {
      this.logger.error(`Error performing OCR on image ${s3Key}: ${error.message}`);
      return null;
    }
  }

  private checkIfPaused(): boolean {
    if (this.pausedUntil && new Date() < this.pausedUntil) {
      return true;
    }
    if (this.pausedUntil && new Date() >= this.pausedUntil) {
      this.isBackblazePaused = false;
      this.pausedUntil = null;
      this.backblazeErrorCount = 0;
      this.logger.log('⚡ Backblaze pause period expired, resuming downloads');
    }
    return false;
  }

  private handleBackblazeError(error: any, s3Key: string): void {
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('bandwidth') || errorMessage.includes('cap exceeded') || errorMessage.includes('transaction')) {
      this.backblazeErrorCount++;
      
      if (this.backblazeErrorCount >= 5 && !this.isBackblazePaused) {
        this.isBackblazePaused = true;
        this.pausedUntil = new Date(Date.now() + 60 * 60 * 1000);
        this.logger.warn(
          `🚫 Backblaze límite alcanzado. Pausando descargas hasta ${this.pausedUntil.toLocaleTimeString()}. ` +
          `Revisa tu cuenta Backblaze para aumentar el límite.`
        );
      } else if (!this.isBackblazePaused) {
        this.logger.warn(`⚠️ Error de límite Backblaze (${this.backblazeErrorCount}/5) para ${s3Key}`);
      }
    } else {
      this.logger.error(`Error downloading from Backblaze ${s3Key}: ${errorMessage}`);
    }
  }

  private async downloadFromS3(s3Key: string): Promise<Buffer | null> {
    if (this.checkIfPaused()) {
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        this.logger.warn(`No body in S3 response for ${s3Key}`);
        return null;
      }

      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      this.backblazeErrorCount = 0;
      return Buffer.concat(chunks);
    } catch (error) {
      this.handleBackblazeError(error, s3Key);
      return null;
    }
  }

  async processEmailAttachments(attachments: any[]): Promise<Map<string, string>> {
    const extractedTexts = new Map<string, string>();

    if (!attachments || attachments.length === 0) {
      return extractedTexts;
    }

    this.logger.log(`Processing ${attachments.length} attachments for text extraction`);

    for (const attachment of attachments) {
      const text = await this.processAttachment(attachment);
      if (text && text.length > 0) {
        extractedTexts.set(attachment.filename || attachment.s3Key, text);
      }
    }

    this.logger.log(`Successfully extracted text from ${extractedTexts.size} attachments`);
    return extractedTexts;
  }

  searchInExtractedTexts(extractedTexts: Map<string, string>, searchPattern: string): boolean {
    const pattern = searchPattern.toLowerCase();
    
    for (const [filename, text] of extractedTexts.entries()) {
      if (text.toLowerCase().includes(pattern)) {
        this.logger.log(`Found pattern "${searchPattern}" in attachment: ${filename}`);
        return true;
      }
    }
    
    return false;
  }

  async processEmailAttachmentsBatch(
    emails: any[],
    batchSize: number = 10,
    maxConcurrency: number = 3
  ): Promise<Map<string, Map<string, string>>> {
    const results = new Map<string, Map<string, string>>();

    if (!emails || emails.length === 0) {
      return results;
    }

    this.logger.log(`📦 Processing ${emails.length} emails in batches (batch size: ${batchSize}, max concurrent: ${maxConcurrency})`);

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      this.logger.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emails.length / batchSize)} (${batch.length} emails)`);

      const batchPromises = batch.map(async (email) => {
        try {
          if (!email.attachmentsData) {
            return { emailId: email.id, extractedTexts: new Map() };
          }

          const attachments = typeof email.attachmentsData === 'string'
            ? JSON.parse(email.attachmentsData)
            : email.attachmentsData;

          const extractedTexts = await this.processEmailAttachments(attachments);
          return { emailId: email.id, extractedTexts };
        } catch (error) {
          this.logger.error(`Error processing email ${email.id}: ${error.message}`);
          return { emailId: email.id, extractedTexts: new Map() };
        }
      });

      const batchResults = await this.limitConcurrency(batchPromises, maxConcurrency);
      
      for (const result of batchResults) {
        results.set(result.emailId, result.extractedTexts);
      }

      await this.delay(500);
    }

    this.logger.log(`✅ Batch processing complete. Processed ${results.size} emails`);
    return results;
  }

  private async limitConcurrency<T>(
    promises: Promise<T>[],
    maxConcurrency: number
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < promises.length; i += maxConcurrency) {
      const chunk = promises.slice(i, i + maxConcurrency);
      const chunkResults = await Promise.all(chunk);
      results.push(...chunkResults);
    }
    
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
