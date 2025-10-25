import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { createHash } from 'crypto';
import { randomUUID } from 'crypto';

interface KnowledgeEntry {
  category: string;
  title: string;
  content: string;
  keywords: string[];
  source: string;
  sourceId?: string;
  metadata?: any;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private readonly MAX_ENTRIES_PER_ORG = 100;
  private readonly MIN_RELEVANCE_SCORE = 0.5;
  private readonly CONTENT_MIN_LENGTH = 20;
  private readonly SIMILARITY_THRESHOLD = 0.7;

  constructor(private prisma: PrismaService) {}

  private generateContentHash(content: string, category: string): string {
    const normalized = content.toLowerCase().trim().replace(/\s+/g, ' ');
    return createHash('sha256').update(`${category}:${normalized}`).digest('hex');
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'y', 'o', 'en', 'a', 'por', 'para',
      'con', 'sin', 'sobre', 'que', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    const wordFreq = new Map<string, number>();
    words.forEach(word => wordFreq.set(word, (wordFreq.get(word) || 0) + 1));

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const normalize = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);

    if (norm1 === norm2) return 1.0;

    const set1 = new Set(norm1.split(' '));
    const set2 = new Set(norm2.split(' '));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private async findSimilarEntry(
    organizationId: string,
    category: string,
    content: string,
  ): Promise<any | null> {
    try {
      const entries = await this.prisma.knowledge_base.findMany({
        where: {
          organizationId,
          category,
        },
        take: 20,
        orderBy: { relevanceScore: 'desc' },
      });

      for (const entry of entries) {
        const similarity = this.calculateSimilarity(content, entry.content);
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          return entry;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Error buscando entrada similar: ${error.message}`);
      return null;
    }
  }

  async addKnowledge(
    organizationId: string,
    userId: string | null,
    entry: KnowledgeEntry,
  ): Promise<boolean> {
    try {
      if (entry.content.length < this.CONTENT_MIN_LENGTH) {
        return false;
      }

      const contentHash = this.generateContentHash(entry.content, entry.category);

      const exactMatch = await this.prisma.knowledge_base.findUnique({
        where: {
          organizationId_contentHash: {
            organizationId,
            contentHash,
          },
        },
      });

      if (exactMatch) {
        await this.prisma.knowledge_base.update({
          where: { id: exactMatch.id },
          data: {
            usageCount: exactMatch.usageCount + 1,
            lastUsedAt: new Date(),
            relevanceScore: Math.min(exactMatch.relevanceScore + 0.2, 5.0),
            updatedAt: new Date(),
          },
        });
        this.logger.debug(`📝 Actualizado (exacto): ${entry.title}`);
        return true;
      }

      const similar = await this.findSimilarEntry(organizationId, entry.category, entry.content);

      if (similar) {
        const betterContent = entry.content.length > similar.content.length 
          ? entry.content 
          : similar.content;
        
        const keywords = entry.keywords.length > 0 
          ? entry.keywords 
          : this.extractKeywords(betterContent);

        await this.prisma.knowledge_base.update({
          where: { id: similar.id },
          data: {
            content: betterContent,
            keywords,
            contentHash: this.generateContentHash(betterContent, entry.category),
            usageCount: similar.usageCount + 1,
            lastUsedAt: new Date(),
            relevanceScore: Math.min(similar.relevanceScore + 0.3, 5.0),
            updatedAt: new Date(),
          },
        });
        this.logger.log(`🔄 Actualizado (similar): ${entry.title}`);
        return true;
      }

      const totalEntries = await this.prisma.knowledge_base.count({
        where: { organizationId },
      });

      if (totalEntries >= this.MAX_ENTRIES_PER_ORG) {
        await this.cleanupLowValueEntries(organizationId);
      }

      const keywords = entry.keywords.length > 0 
        ? entry.keywords 
        : this.extractKeywords(entry.content);

      await this.prisma.knowledge_base.create({
        data: {
          id: randomUUID(),
          organizationId,
          userId,
          category: entry.category,
          title: entry.title,
          content: entry.content,
          keywords,
          contentHash,
          source: entry.source,
          sourceId: entry.sourceId,
          metadata: entry.metadata || {},
          updatedAt: new Date(),
        },
      });

      this.logger.log(`✅ Nuevo: [${entry.category}] ${entry.title}`);
      return true;
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      return false;
    }
  }

  async extractKnowledgeFromEmail(
    organizationId: string,
    userId: string | null,
    email: any,
    operationContext?: any,
  ): Promise<void> {
    try {
      const patterns = [
        {
          regex: /(?:mbl|awb|hawb|booking)[\s:]+([A-Z0-9-]+)/gi,
          category: 'tracking_numbers',
          title: 'Número de rastreo identificado',
        },
        {
          regex: /(?:incoterm|incoterms?)[\s:]+([A-Z]{3})/gi,
          category: 'incoterms',
          title: 'Incoterm utilizado',
        },
        {
          regex: /(?:puerto|port)[\s:]+([A-Za-z\s]+?)(?:\.|,|$)/gi,
          category: 'ports',
          title: 'Puerto mencionado',
        },
        {
          regex: /(?:naviera|shipping line|carrier)[\s:]+([A-Za-z\s]+?)(?:\.|,|$)/gi,
          category: 'carriers',
          title: 'Naviera/Transportista',
        },
      ];

      const combinedText = `${email.subject} ${email.body}`.substring(0, 2000);

      for (const pattern of patterns) {
        const matches = combinedText.matchAll(pattern.regex);
        for (const match of matches) {
          if (match[1] && match[1].length > 2) {
            await this.addKnowledge(organizationId, userId, {
              category: pattern.category,
              title: pattern.title,
              content: match[1].trim(),
              keywords: [match[1].trim().toLowerCase()],
              source: 'email',
              sourceId: email.id,
              metadata: {
                emailSubject: email.subject,
                operationId: operationContext?.id,
              },
            });
          }
        }
      }

      const fromDomain = email.from.match(/@([^>]+)/)?.[1];
      if (fromDomain && !fromDomain.includes('gmail') && !fromDomain.includes('hotmail')) {
        await this.addKnowledge(organizationId, userId, {
          category: 'contacts',
          title: `Contacto frecuente: ${email.from.split('<')[0].trim()}`,
          content: `${email.from} - Dominio: ${fromDomain}`,
          keywords: [fromDomain, email.from.split('<')[0].trim().toLowerCase()],
          source: 'email',
          sourceId: email.id,
        });
      }

      if (operationContext) {
        const opType = operationContext.operationType;
        if (opType && combinedText.length > 100) {
          const snippet = combinedText.substring(0, 200);
          await this.addKnowledge(organizationId, userId, {
            category: 'operation_patterns',
            title: `Patrón en operación ${opType}`,
            content: snippet,
            keywords: this.extractKeywords(snippet),
            source: 'email',
            sourceId: email.id,
            metadata: {
              operationType: opType,
              operationId: operationContext.id,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error extrayendo conocimiento de email: ${error.message}`);
    }
  }

  async getRelevantKnowledge(
    organizationId: string,
    context: {
      category?: string;
      keywords?: string[];
      operationType?: string;
      limit?: number;
    },
  ): Promise<any[]> {
    try {
      const where: any = { organizationId };

      if (context.category) {
        where.category = context.category;
      }

      if (context.keywords && context.keywords.length > 0) {
        where.keywords = {
          hasSome: context.keywords,
        };
      }

      const entries = await this.prisma.knowledge_base.findMany({
        where,
        orderBy: [
          { relevanceScore: 'desc' },
          { usageCount: 'desc' },
          { lastUsedAt: 'desc' },
        ],
        take: context.limit || 10,
      });

      for (const entry of entries) {
        await this.prisma.knowledge_base.update({
          where: { id: entry.id },
          data: {
            usageCount: entry.usageCount + 1,
            lastUsedAt: new Date(),
          },
        });
      }

      return entries;
    } catch (error) {
      this.logger.error(`Error obteniendo conocimiento relevante: ${error.message}`);
      return [];
    }
  }

  private async cleanupLowValueEntries(organizationId: string): Promise<void> {
    try {
      const lowValueEntries = await this.prisma.knowledge_base.findMany({
        where: {
          organizationId,
          OR: [
            { relevanceScore: { lt: this.MIN_RELEVANCE_SCORE } },
            {
              AND: [
                { usageCount: { lt: 3 } },
                { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
              ],
            },
          ],
        },
        orderBy: { relevanceScore: 'asc' },
        take: 50,
      });

      if (lowValueEntries.length > 0) {
        await this.prisma.knowledge_base.deleteMany({
          where: {
            id: { in: lowValueEntries.map(e => e.id) },
          },
        });

        this.logger.log(`🧹 Limpieza automática: ${lowValueEntries.length} entradas de bajo valor eliminadas`);
      }
    } catch (error) {
      this.logger.error(`Error en limpieza de entradas: ${error.message}`);
    }
  }

  async getStatistics(organizationId: string): Promise<any> {
    try {
      const total = await this.prisma.knowledge_base.count({
        where: { organizationId },
      });

      const byCategory = await this.prisma.knowledge_base.groupBy({
        by: ['category'],
        where: { organizationId },
        _count: true,
      });

      const topEntries = await this.prisma.knowledge_base.findMany({
        where: { organizationId },
        orderBy: [
          { relevanceScore: 'desc' },
          { usageCount: 'desc' },
        ],
        take: 10,
      });

      return {
        total,
        maxCapacity: this.MAX_ENTRIES_PER_ORG,
        byCategory: byCategory.map(cat => ({
          category: cat.category,
          count: cat._count,
        })),
        topEntries: topEntries.map(e => ({
          title: e.title,
          category: e.category,
          relevanceScore: e.relevanceScore,
          usageCount: e.usageCount,
        })),
      };
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas: ${error.message}`);
      return { total: 0, byCategory: [], topEntries: [] };
    }
  }

  async deleteEntry(id: string, organizationId: string): Promise<boolean> {
    try {
      await this.prisma.knowledge_base.delete({
        where: {
          id,
          organizationId,
        },
      });
      return true;
    } catch (error) {
      this.logger.error(`Error eliminando entrada: ${error.message}`);
      return false;
    }
  }
}
