import { Injectable, Logger } from '@nestjs/common';
import { createWorker } from 'tesseract.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private s3Client: S3Client;
  private ocrWorker: any = null;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
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
      const { contentType, s3Key, filename } = attachment;

      if (!s3Key) {
        this.logger.warn(`Attachment ${filename} has no S3 key, skipping`);
        return null;
      }

      // Determine the type of document
      if (contentType === 'application/pdf') {
        return await this.extractTextFromPDF(s3Key);
      } else if (contentType?.startsWith('image/')) {
        return await this.extractTextFromImage(s3Key);
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

  private async downloadFromS3(s3Key: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
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

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Error downloading from S3 ${s3Key}: ${error.message}`);
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
}
