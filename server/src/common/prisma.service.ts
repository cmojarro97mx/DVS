import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

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
        
        await this.ensureAutomatedEmployee();
        
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

  private async ensureAutomatedEmployee(): Promise<void> {
    try {
      const AUTOMATED_EMAIL = 'automatizado@nexxio.system';
      const AUTOMATED_USER_ID = 'automated-system-user';
      const AUTOMATED_EMPLOYEE_ID = 'automated-system-employee';

      const existingUser = await this.users.findUnique({
        where: { id: AUTOMATED_USER_ID },
      });

      if (!existingUser) {
        this.logger.log('Creating automated system user and employee...');

        const randomPassword = randomBytes(32).toString('hex');

        await this.users.create({
          data: {
            id: AUTOMATED_USER_ID,
            email: AUTOMATED_EMAIL,
            password: randomPassword,
            name: 'Automatizado',
            role: 'system',
            status: 'Active',
            updatedAt: new Date(),
          },
        });

        await this.employees.create({
          data: {
            id: AUTOMATED_EMPLOYEE_ID,
            name: 'Automatizado',
            email: AUTOMATED_EMAIL,
            role: 'Sistema',
            status: 'Active',
            department: 'Sistema',
            updatedAt: new Date(),
            users: {
              connect: { id: AUTOMATED_USER_ID },
            },
          },
        });

        this.logger.log('✓ Automated system user and employee created successfully');
      }
    } catch (error) {
      this.logger.error('Error ensuring automated employee:', error);
    }
  }
}
