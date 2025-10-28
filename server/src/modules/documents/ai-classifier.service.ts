import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../common/prisma.service';

export interface ClassificationResult {
  category: string;
  confidence: number;
  reasoning?: string;
}

@Injectable()
export class AIClassifierService {
  private genAI: GoogleGenerativeAI | null = null;
  private isConfigured: boolean = false;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    
    if (!apiKey) {
      console.warn('⚠️  Google Gemini API key not configured. AI document classification will be disabled.');
      console.warn('   To enable AI classification, set the GEMINI_API_KEY environment variable.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.isConfigured = true;
    console.log('✓ AI Document Classifier configured successfully');
  }

  async classifyDocument(
    fileName: string,
    mimeType: string,
    fileContent?: Buffer,
  ): Promise<ClassificationResult> {
    if (!this.isConfigured || !this.genAI) {
      return {
        category: 'other',
        confidence: 0,
        reasoning: 'AI classifier not configured',
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = this.buildClassificationPrompt(fileName, mimeType);

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return this.parseClassificationResponse(text);
    } catch (error) {
      console.error('Error classifying document:', error);
      return {
        category: 'other',
        confidence: 0,
        reasoning: 'Classification error',
      };
    }
  }

  private buildClassificationPrompt(fileName: string, mimeType: string): string {
    return `You are a document classifier for a logistics and supply chain management platform.
Analyze the following document and classify it into ONE of these categories:

Categories:
- payment: Payment receipts, bank transfers, payment confirmations
- expense: Expense reports, purchase receipts, vendor bills
- invoice: Invoices, billing documents, commercial invoices
- image: Photos, screenshots, diagrams (not documents)
- xml: XML files (CFDI, SAT, electronic invoices)
- contract: Contracts, agreements, legal documents
- customs: Customs declarations, import/export documents
- shipping: Bills of lading, shipping manifests, tracking documents
- spam: Promotional content, advertisements, irrelevant files
- other: Any other type of document

Document Information:
- File name: ${fileName}
- MIME type: ${mimeType}

Respond ONLY with a valid JSON object in this exact format (no markdown, no backticks, no extra text):
{
  "category": "one of the categories above",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this document belongs to this category"
}

The confidence should be a number between 0 and 1.`;
  }

  private parseClassificationResponse(text: string): ClassificationResult {
    try {
      const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const validCategories = [
        'payment',
        'expense',
        'invoice',
        'image',
        'xml',
        'contract',
        'customs',
        'shipping',
        'spam',
        'other',
      ];

      const category = validCategories.includes(parsed.category) ? parsed.category : 'other';
      const confidence = Math.min(Math.max(parsed.confidence || 0, 0), 1);

      return {
        category,
        confidence,
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
    } catch (error) {
      console.error('Error parsing classification response:', error);
      return {
        category: 'other',
        confidence: 0,
        reasoning: 'Failed to parse AI response',
      };
    }
  }

  async classifyAndUpdateDocument(documentId: string): Promise<void> {
    const document = await this.prisma.documents.findUnique({
      where: { id: documentId },
    });

    if (!document || document.type !== 'file') {
      return;
    }

    const classification = await this.classifyDocument(
      document.name,
      document.mimeType || 'application/octet-stream',
    );

    await this.prisma.documents.update({
      where: { id: documentId },
      data: {
        autoClassified: true,
        classifiedAs: classification.category,
        classificationScore: classification.confidence,
        metadata: {
          classificationReasoning: classification.reasoning,
        },
      },
    });
  }

  async batchClassifyDocuments(operationId: string): Promise<void> {
    const documents = await this.prisma.documents.findMany({
      where: {
        operationId,
        type: 'file',
        autoClassified: false,
      },
    });

    for (const document of documents) {
      await this.classifyAndUpdateDocument(document.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async getAutomationConfig(organizationId: string) {
    let config = await this.prisma.document_automation_config.findUnique({
      where: { organizationId },
    });

    if (!config) {
      config = await this.prisma.document_automation_config.create({
        data: {
          organizationId,
          enabled: false,
        },
      });
    }

    return config;
  }

  async updateAutomationConfig(
    organizationId: string,
    updates: Partial<{
      enabled: boolean;
      autoExtractFromEmails: boolean;
      autoClassify: boolean;
      autoOrganize: boolean;
      excludeSpam: boolean;
      minConfidenceScore: number;
    }>,
  ) {
    return this.prisma.document_automation_config.upsert({
      where: { organizationId },
      update: updates,
      create: {
        organizationId,
        ...updates,
      },
    });
  }
}
