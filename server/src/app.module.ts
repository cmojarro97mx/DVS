import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { EmployeesModule } from './modules/employees/employees.module';
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
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { GoogleAuthModule } from './modules/google-auth/google-auth.module';
import { GoogleCalendarModule } from './modules/google-calendar/google-calendar.module';
import { GmailModule } from './modules/gmail/gmail.module';
import { EmailStorageModule } from './modules/email-storage/email-storage.module';
import { EmailSyncModule } from './modules/email-sync/email-sync.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppConfigModule } from './modules/config/config.module';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ClientsModule,
    EmployeesModule,
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
    GoogleAuthModule,
    GoogleCalendarModule,
    GmailModule,
    EmailStorageModule,
    EmailSyncModule,
    NotificationsModule,
    AppConfigModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
