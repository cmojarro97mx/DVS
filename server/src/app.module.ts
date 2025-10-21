import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { OperationsModule } from './modules/operations/operations.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotesModule } from './modules/notes/notes.module';
import { FilesModule } from './modules/files/files.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { LeadsModule } from './modules/leads/leads.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    OperationsModule,
    InvoicesModule,
    PaymentsModule,
    ExpensesModule,
    TasksModule,
    NotesModule,
    FilesModule,
    CalendarModule,
    LeadsModule,
    QuotationsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
