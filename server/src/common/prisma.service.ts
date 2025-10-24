import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxRetries = 5;
  private readonly retryDelay = 2000;

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'minimal',
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error('Prisma error:', e);
      this.isConnected = false;
    });

    this.$on('warn' as never, (e: any) => {
      this.logger.warn('Prisma warning:', e);
    });

    this.$on('info' as never, (e: any) => {
      this.logger.log('Prisma info:', e);
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    while (this.connectionAttempts < this.maxRetries && !this.isConnected) {
      try {
        this.connectionAttempts++;
        this.logger.log(`Attempting to connect to database (attempt ${this.connectionAttempts}/${this.maxRetries})...`);
        
        await this.$connect();
        
        await this.$queryRaw`SELECT 1`;
        
        this.isConnected = true;
        this.connectionAttempts = 0;
        this.logger.log('✓ Database connected successfully');
        return;
      } catch (error) {
        this.isConnected = false;
        this.logger.error(
          `Failed to connect to database (attempt ${this.connectionAttempts}/${this.maxRetries}):`,
          error instanceof Error ? error.message : String(error)
        );

        if (this.connectionAttempts < this.maxRetries) {
          this.logger.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          this.logger.error('Max connection attempts reached. Database connection failed.');
          throw error;
        }
      }
    }
  }

  async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Database connection lost. Attempting to reconnect...');
      this.connectionAttempts = 0;
      await this.connectWithRetry();
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Database disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
    }
  }
}
