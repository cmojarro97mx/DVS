import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import DashboardPageContent from './DashboardPageContent';
import LogisticsProjectsPage from './LogisticsProjectsPage';
import CreateOperationPage from './CreateOperationPage';
import OperationDetailPage from './OperationDetailPage';
import ClientsManager from './ClientsManager';
import CreateClientPage from './CreateClientPage'; // New
import ClientDetailPage from './ClientDetailPanel';
import EmailClientPage from './EmailClientPage';
import FinanceDashboardPage from './FinanceDashboardPage';
import FinanceHubPage from './FinanceHubPage'; // Import new page
import AllExpensesPage from './AllExpensesPage';
import AllInvoicesPage from './AllInvoicesPage';
import AllPaymentsPage from './AllPaymentsPage';
import CalendarPage from './CalendarPage';
import QuotationsPage from './QuotationsPage';
import EmployeesPage from './EmployeesPage';
import AdminPage from './AdminPage'; // Import new page
import BankAccountsPage from './BankAccountsPage';
import BankReconciliationPage from './BankReconciliationPage';
import { ConfirmationModal } from '../components/ConfirmationModal';
import IntegrationsPage from './IntegrationsPage'; // New Integrations Page
import CompanyProfilePage from './CompanyProfilePage'; // New Company Profile Page
import LinkedAccountsPage from './LinkedAccountsPage'; // New Linked Accounts Page
import EmailAnalysisPage from './EmailAnalysisPage'; // Email Analysis Page
import AIOperationCreatorPage from './AIOperationCreatorPage';
import CompanyHubPage from './CompanyHubPage'; // Import new Company Hub Page
import EmailHubPage from './EmailHubPage'; // Import new Email Hub Page
import NotificationsSettingsPage from './NotificationsSettingsPage'; // Notifications Settings Page
import FileManagerPage from './FileManagerPage'; // File Manager Page
import AutomationPage from './AutomationPage'; // Automation Page
import VirtualAssistantConfigPage from '../src/pages/VirtualAssistant/VirtualAssistantConfigPage'; // Virtual Assistant Config Page
import TaskAutomationPage from './TaskAutomationPage'; // Task Automation Page
import KnowledgeBasePage from '../src/pages/KnowledgeBase/KnowledgeBasePage'; // Knowledge Base Page
import { employeesService } from '../src/services/employeesService';
import { clientsService } from '../src/services/clientsService';
import { notesService } from '../src/services/notesService';
import { tasksService } from '../src/services/tasksService';
import { operationsService } from '../src/services/operationsService';
import { 
    initialProjects, 
    initialClients, 
    initialTeamMembers,
    initialTasksData,
    initialColumnsData,
    initialColumnOrderData,
    initialEmails,
    initialAccounts,
    initialEvents,
    initialQuotations,
    initialReconciliationHistory,
    initialBankAccounts,
    initialInvoices,
    initialPayments,
    initialExpenses,
    initialNotes,
} from '../data/dummyData';

export interface UploadedFile {
  file: File;
  preview: string;
}

export interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parentId: string | null;
  file?: File;
  preview?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  hireDate?: string;
  status: 'Active' | 'Inactive';
}

export interface Commission {
  employeeName: string;
  rate: number; // as percentage
}

export interface CommissionSnapshot {
  id: string;
  timestamp: string;
  savedBy: string;
  commissions: Commission[];
  projectedProfit: number;
  realProfit: number;
}


export interface Project {
  id: string;
  projectName: string;
  projectCategory: string;
  startDate: string;
  deadline: string;
  status: string;
  assignees: string[];
  progress: number;
  operationType: string;
  insurance: string;
  shippingMode: string;
  courrier: string;
  bookingTracking: string;
  etd: string;
  eta: string;
  pickupDate: string;
  pickupAddress: string;
  deliveryAddress: string;
  mbl_awb: string;
  hbl_awb: string;
  notes: string;
  clientId: string;
  documents?: FileSystemItem[];
  currency: Currency;
  commissionHistory?: CommissionSnapshot[];
  // FIX: Added optional 'supplierIds' property to Project interface.
  supplierIds?: string[];
}

export interface Note {
  id: string;
  author: string;
  timestamp: string;
  content: string;
  attachment?: UploadedFile;
}

export interface Task {
  id: string;
  operationId: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  assignees: string[];
  dueDate: string;
  createdBy?: string;
  lastModifiedBy?: string;
  emailSourceId?: string;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export type Currency = 'USD' | 'MXN' | 'EUR';

export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  currency: Currency;
}

export interface Expense {
    id: string;
    operationId?: string; // Expenses can be administrative and not tied to an operation
    itemName: string;
    currency: Currency;
    exchangeRate: number;
    price: number;
    purchaseDate: string;
    employee: string;
    expenseCategory: string;
    purchasedFrom?: string;
    bankAccount: string; // Bank account is now required
    description?: string;
    bill?: UploadedFile;
}

export interface InvoiceItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  amount: number;
}

export interface Invoice {
    id: string;
    operationId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    currency: Currency;
    exchangeRate: number;
    client: string;
    bankAccount?: string;
    paymentDetails?: string;
    generatedBy?: string;
    billingAddress?: string;
    shippingAddress?: string;
    discount: number;
    discountType: '%' | 'flat';
    items: InvoiceItem[];
    subTotal: number;
    taxAmount: number;
    total: number;
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Canceled';
}

export interface Payment {
    id: string;
    operationId: string;
    invoiceId: string;
    paymentDate: string;
    amount: number;
    currency: Currency;
    paymentMethod: string;
    notes?: string;
    bankAccountId?: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface TaxInfo {
  rfc: string;
  taxRegime: string;
  cfdiUse: string;
  taxAddress: string;
  postalCode: string;
  billingEmail: string;
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive';
  taxId?: string;
  tier?: 'Gold' | 'Silver' | 'Bronze' | 'Standard';
  contacts?: Contact[];
  currency?: Currency;
  documents?: FileSystemItem[];
  taxInfo?: TaxInfo;
  taxCertificate?: UploadedFile;
}

// FIX: Added and exported the Supplier interface.
export interface Supplier {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  contacts?: Contact[];
  services?: string[];
  rating?: number;
  documents?: UploadedFile[];
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  serviceInterest: string;
  message: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  source: 'AI Widget' | 'Manual Entry';
  createdAt: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  leadId?: string;
  clientName: string;
  date: string;
  validUntil: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  currency: string;
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface EmailAttachment {
    filename: string;
    size: string;
    url: string;
}

export interface EmailMessage {
    id: string;
    threadId: string;
    accountId: string;
    folder: string;
    from: string;
    fromName: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    snippet: string;
    body: string;
    date: string;
    unread: boolean;
    starred: boolean;
    attachments: EmailAttachment[];
}

export interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'gsuite' | 'other';
  status: 'connected' | 'error';
  password?: string;
  smtpHost?: string;
  smtpPort?: number;
  imapHost?: string;
  imapPort?: number;
  syncEmail?: boolean;
  syncCalendar?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  allDay: boolean;
  start: string;
  end: string;
  category: 'Meeting' | 'Deadline' | 'Shipment' | 'Personal' | 'Other';
}

export interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
}

export interface SatInvoice {
    uuid: string;
    issuerName: string;
    receiverName: string;
    date: string;
    total: number;
    currency: 'MXN' | 'USD';
    status: 'Vigente' | 'Cancelado';
    pdfUrl: string;
    xmlUrl: string;
}

export interface ReconciliationSession {
  id: string;
  date: Date;
  status: 'processing' | 'completed' | 'saved' | 'error';
  summary: {
    reconciledCount: number;
    unreconciledCount: number;
    totalTransactions: number;
    totalDebitTransactions: number;
    progressPercentage: number;
    reconciledAmount: number;
  };
  data: {
    transactions: BankTransaction[];
    reconciliationMap: Map<string, string>;
    bankStatements: { name: string; size: number }[];
    reconciliationMonth: Date;
  };
}

export type View =
  | 'dashboard'
  | 'operations'
  | 'create-operation'
  | 'detail-operation'
  | 'clients'
  | 'create-client'
  | 'client-detail'
  | 'employees'
  | 'quotations'
  | 'emails'
  | 'calendar'
  | 'files'
  | 'finance-hub'
  | 'finance'
  | 'all_expenses'
  | 'all_invoices'
  | 'all_payments'
  | 'bank_accounts'
  | 'bank-reconciliation'
  | 'admin'
  | 'company-profile'
  | 'integrations'
  | 'linked-accounts'
  | 'email-analysis'
  | 'ai-agents'
  | 'ai-operation-creator'
  | 'company-hub'
  | 'email-hub'
  | 'notifications-settings'
  | 'automations'
  | 'virtual-assistant'
  | 'task-automation';

const viewTitles: Record<View, string> = {
  dashboard: 'Dashboard',
  operations: 'Logistics Operations',
  'create-operation': 'Create New Operation',
  'detail-operation': 'Operation Details',
  clients: 'Clients',
  'create-client': 'Create New Client',
  'client-detail': 'Client Details',
  employees: 'Employees',
  quotations: 'Quotations',
  emails: 'Email Client',
  calendar: 'Calendar',
  files: 'Gestor de Archivos',
  'finance-hub': 'Financial Hub',
  finance: 'Financial Overview',
  all_expenses: 'All Expenses',
  all_invoices: 'All Invoices',
  all_payments: 'All Payments',
  bank_accounts: 'Bank Accounts',
  'bank-reconciliation': 'Bank Reconciliation',
  admin: 'Company',
  automations: 'Automatizaciones',
  'company-profile': 'Company Profile',
  integrations: 'Conexiones',
  'linked-accounts': 'Linked Accounts',
  'email-analysis': 'Análisis de Correo',
  'ai-agents': 'Automation Assistant',
  'ai-operation-creator': 'AI Operation Creator',
  'company-hub': 'Empresa',
  'email-hub': 'Email & Calendario',
  'virtual-assistant': 'Asistente Virtual',
  'notifications-settings': 'Configuración de Notificaciones',
  'task-automation': 'Task Automatizados'
};


interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [operationDetailInitialState, setOperationDetailInitialState] = useState<{ openTab?: string; editInvoiceId?: string; viewInvoiceId?: string } | null>(null);

  // States
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [tasks, setTasks] = useState<Record<string, Task>>(initialTasksData);
  const [columns, setColumns] = useState<Record<string, Column>>(initialColumnsData);
  const [columnOrder, setColumnOrder] = useState<string[]>(initialColumnOrderData);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [reconciliationHistory, setReconciliationHistory] = useState<ReconciliationSession[]>(initialReconciliationHistory);
  const [emails, setEmails] = useState<EmailMessage[]>(initialEmails);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>(initialAccounts);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employees = await employeesService.getAll();
        const teamMembersData: TeamMember[] = employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          phone: emp.phone,
          hireDate: emp.createdAt,
          status: emp.status as 'Active' | 'Inactive',
        }));
        setTeamMembers(teamMembersData);
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };

    const loadClients = async () => {
      try {
        console.log('🔍 Loading clients...');
        const clientsData = await clientsService.getAll();
        console.log('✅ Clients loaded:', clientsData.length, 'clients');
        setClients(clientsData as Client[]);
      } catch (error) {
        console.error('❌ Error loading clients:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
      }
    };

    const loadNotes = async () => {
      try {
        const notesData = await notesService.getAll();
        setNotes(notesData);
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };

    loadEmployees();
    loadClients();
    loadNotes();
  }, []);

  const projectsWithRealProgress = useMemo(() => {
    // FIX: Explicitly cast Object.values results to fix 'unknown' type errors,
    // ensuring properties can be accessed safely.
    const doneColumn = (Object.values(columns) as Column[]).find(col => col.title.toLowerCase() === 'done');
    const doneTaskIds = doneColumn ? new Set(doneColumn.taskIds) : new Set<string>();

    const allTasks = Object.values(tasks) as Task[];

    return projects.map(project => {
      const projectTasks = allTasks.filter(task => task.operationId === project.id);

      if (projectTasks.length === 0) {
        return { ...project, progress: project.status === 'Delivered' ? 100 : 0 };
      }

      const doneTaskCount = projectTasks.filter(task => doneTaskIds.has(task.id)).length;

      const progress = Math.round((doneTaskCount / projectTasks.length) * 100);

      if (project.status === 'Delivered' && progress < 100) {
        return { ...project, progress: 100 };
      }

      return { ...project, progress };
    });
  }, [projects, tasks, columns]);

  const handleCreateOperation = (projectDetails: Omit<Project, 'id' | 'progress'>, files: UploadedFile[]) => {
    const documentItems: FileSystemItem[] = files.map((f, i) => ({
      id: `file-new-${Date.now()}-${i}`,
      name: f.file.name,
      type: 'file',
      parentId: null,
      file: f.file,
      preview: f.preview,
    }));

    const newProject: Project = {
      ...projectDetails,
      id: `OP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      progress: 0,
      documents: documentItems
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    setActiveView('detail-operation');
  };

  const handleViewClientDetails = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveView('client-detail');
  };

  const handleSaveNewClient = async (clientData: Omit<Client, 'id'>) => {
    try {
      const newClient = await clientsService.create(clientData as any);
      setClients(prev => [newClient as Client, ...prev]);
      setSelectedClientId(newClient.id);
      setActiveView('client-detail');
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      const updated = await clientsService.update(updatedClient.id, updatedClient as any);
      setClients(prev => prev.map(c => c.id === updated.id ? updated as Client : c));
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await clientsService.delete(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (selectedClientId === clientId) {
        setActiveView('clients');
        setSelectedClientId(null);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleAddClient = useCallback((clientData: Omit<Client, 'id'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}`
    };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  }, []);

  const handleViewOperation = async (operationId: string) => {
    console.log('=== handleViewOperation called ===', operationId);
    setSelectedProjectId(operationId);
    setOperationDetailInitialState(null);
    setActiveView('detail-operation');
    
    // Load tasks for this operation from backend
    try {
      console.log('Loading tasks for operation:', operationId);
      const operationTasks = await tasksService.getAll(operationId);
      console.log('Tasks loaded from backend:', operationTasks);
      
      // Transform assignees from backend format to frontend format
      const transformedTasks = operationTasks.reduce((acc, task) => {
        const transformedAssignees = task.assignees 
          ? task.assignees.map((a: any) => a.user?.name || 'Unknown')
          : [];
        
        acc[task.id] = {
          ...task,
          operationId: operationId,
          assignees: transformedAssignees
        };
        return acc;
      }, {} as Record<string, any>);
      
      console.log('Transformed tasks:', transformedTasks);
      
      // Update tasks state with loaded tasks
      setTasks(prev => {
        const newTasks = {
          ...prev,
          ...transformedTasks
        };
        console.log('Updated tasks state:', newTasks);
        return newTasks;
      });
      
      // Update columns with task IDs from loaded tasks
      setColumns(prev => {
        const updatedColumns = { ...prev };
        
        // Clear all task IDs for this operation first
        Object.keys(updatedColumns).forEach(colId => {
          updatedColumns[colId] = {
            ...updatedColumns[colId],
            taskIds: updatedColumns[colId].taskIds.filter(taskId => {
              const t = transformedTasks[taskId];
              return !t || t.operationId !== operationId;
            })
          };
        });
        
        // Map status to column ID
        const statusToColumnId: Record<string, string> = {
          'To Do': 'column-1',
          'In Progress': 'column-2',
          'Done': 'column-3'
        };
        
        // Add task IDs to their respective columns based on status
        operationTasks.forEach(task => {
          const status = (task as any).status || 'To Do';
          const columnId = statusToColumnId[status];
          
          if (columnId && updatedColumns[columnId]) {
            // Only add if not already present
            if (!updatedColumns[columnId].taskIds.includes(task.id)) {
              updatedColumns[columnId] = {
                ...updatedColumns[columnId],
                taskIds: [...updatedColumns[columnId].taskIds, task.id]
              };
            }
          }
        });
        
        console.log('Updated columns with task IDs:', updatedColumns);
        return updatedColumns;
      });
    } catch (error) {
      console.error('Error loading tasks for operation:', error);
    }
  };

  const handleEditInvoice = (invoiceId: string, operationId: string) => {
    setOperationDetailInitialState({ openTab: 'invoices', editInvoiceId: invoiceId });
    setSelectedProjectId(operationId);
    setActiveView('detail-operation');
  };

  const handleViewInvoiceDetail = (invoiceId: string, operationId: string) => {
    setOperationDetailInitialState({ openTab: 'invoices', viewInvoiceId: invoiceId });
    setSelectedProjectId(operationId);
    setActiveView('detail-operation');
  };

  const handleAddEmployee = (employeeData: Omit<TeamMember, 'id'>) => {
    const newEmployee: TeamMember = {
      ...employeeData,
      id: `tm-${Date.now()}`
    };
    setTeamMembers(prev => [newEmployee, ...prev]);
  };

  const handleUpdateEmployee = (updatedEmployee: TeamMember) => {
    setTeamMembers(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setTeamMembers(prev => prev.filter(emp => emp.id !== employeeId));
  };

  const handleAddQuotation = (quotationData: Omit<Quotation, 'id'>) => {
    const newQuotation: Quotation = {
        ...quotationData,
        id: `QT-${Date.now()}`
    };
    setQuotations(prev => [newQuotation, ...prev]);
  };

  const handleUpdateQuotation = (updatedQuotation: Quotation) => {
      setQuotations(prev => prev.map(q => q.id === updatedQuotation.id ? updatedQuotation : q));
  };

  const handleDeleteQuotation = (quotationId: string) => {
      setQuotations(prev => prev.filter(q => q.id !== quotationId));
  };

  const handleAddBankAccount = (accountData: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
        ...accountData,
        id: `ba-${Date.now()}`
    };
    setBankAccounts(prev => [newAccount, ...prev]);
  };

  const handleUpdateBankAccount = (updatedAccount: BankAccount) => {
    setBankAccounts(prev => prev.map(ba => ba.id === updatedAccount.id ? updatedAccount : ba));
  };

  const handleDeleteBankAccount = (accountId: string) => {
    setBankAccounts(prev => prev.filter(ba => ba.id !== accountId));
  };

  const handleSendEmail = useCallback((email: Omit<EmailMessage, 'id' | 'threadId' | 'unread' | 'snippet' | 'starred'>) => {
      const newEmail: EmailMessage = {
          ...email,
          id: `email-${Date.now()}`,
          threadId: `thread-${Date.now()}`,
          unread: false,
          snippet: email.body.substring(0, 100),
          starred: false,
      };
      setEmails(prev => [newEmail, ...prev]);
  }, []);

  const handleUpdateEmailAccount = (updatedAccount: EmailAccount) => {
      setEmailAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
  };


  const selectedProject = projectsWithRealProgress.find(p => p.id === selectedProjectId);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardPageContent 
          projects={projectsWithRealProgress} 
          clients={clients}
          invoices={invoices}
          expenses={expenses}
          tasks={tasks}
          columns={columns}
          setActiveView={setActiveView} 
          onViewOperation={handleViewOperation}
        />;
      case 'operations':
        return <LogisticsProjectsPage 
          projects={projectsWithRealProgress} 
          setActiveView={setActiveView} 
          onViewOperation={handleViewOperation} 
          onOperationsLoaded={setProjects}
        />;
      case 'create-operation':
        return <CreateOperationPage 
          setActiveView={setActiveView} 
          onCreateOperation={handleCreateOperation} 
          teamMembers={teamMembers} 
          clients={clients}
          onAddClient={handleAddClient}
        />;
      case 'detail-operation':
        if (selectedProject) {
          const projectClient = clients.find(c => c.id === selectedProject.clientId);
          const projectNotes = notes.filter(n => n.operationId === selectedProject.id);
          const projectExpenses = expenses.filter(e => e.operationId === selectedProject.id);
          const projectInvoices = invoices.filter(i => i.operationId === selectedProject.id);
          const projectPayments = payments.filter(p => p.operationId === selectedProject.id);
          return <OperationDetailPage 
            setActiveView={setActiveView} 
            project={selectedProject}
            client={projectClient}
            documents={selectedProject.documents || []}
            onUpdateDocuments={(updatedFiles) => {
                setProjects(projects.map(p => p.id === selectedProject.id ? {...p, documents: updatedFiles} : p))
            }}
            notes={projectNotes}
            onAddNote={async (content, file) => {
                try {
                    let attachmentUrl: string | undefined;
                    let attachmentName: string | undefined;

                    if (file) {
                        const uploadedDoc = await operationsService.uploadDocument(selectedProject.id, file);
                        attachmentUrl = uploadedDoc.url;
                        attachmentName = uploadedDoc.name;
                    }

                    const newNoteData = {
                        content,
                        operationId: selectedProject.id,
                        title: content.substring(0, 50),
                        ...(attachmentUrl && { attachmentUrl }),
                        ...(attachmentName && { attachmentName })
                    };
                    const savedNote = await notesService.create(newNoteData);
                    setNotes(prev => [...prev, savedNote]);
                } catch (error) {
                    console.error('Error creating note:', error);
                    alert('Error al guardar la nota. Por favor, intenta nuevamente.');
                }
            }}
            onUpdateNote={async (noteId, content) => {
                try {
                    const updatedNote = await notesService.update(noteId, { content });
                    setNotes(notes.map(n => n.id === noteId ? updatedNote : n));
                } catch (error) {
                    console.error('Error updating note:', error);
                    alert('Error al actualizar la nota.');
                }
            }}
            onDeleteNote={async (noteId) => {
                try {
                    await notesService.delete(noteId);
                    setNotes(notes.filter(n => n.id !== noteId));
                } catch (error) {
                    console.error('Error deleting note:', error);
                    alert('Error al eliminar la nota.');
                }
            }}
            expenses={projectExpenses}
            onAddExpense={(expense) => setExpenses(prev => [...prev, {...expense, id: `exp-${Date.now()}`}])}
            onUpdateExpense={(expense) => setExpenses(expenses.map(e => e.id === expense.id ? expense : e))}
            onDeleteExpense={(expenseId) => setExpenses(expenses.filter(e => e.id !== expenseId))}
            invoices={projectInvoices}
            onAddInvoice={(invoice) => setInvoices(prev => [...prev, {...invoice, id: `inv-${Date.now()}`}])}
            onUpdateInvoice={(invoice) => setInvoices(invoices.map(i => i.id === invoice.id ? invoice : i))}
            onDeleteInvoice={(invoiceId) => setInvoices(invoices.filter(i => i.id !== invoiceId))}
            payments={projectPayments}
            onAddPayment={(payment) => setPayments(prev => [...prev, {...payment, id: `pay-${Date.now()}`}])}
            onUpdatePayment={(payment) => setPayments(payments.map(e => e.id === payment.id ? payment : e))}
            onDeletePayment={(paymentId) => setPayments(payments.filter(p => p.id !== paymentId))}
            tasks={tasks}
            columns={columns}
            columnOrder={columnOrder}
            onSaveTask={(task) => {
                // Update tasks state
                setTasks(prev => ({...prev, [task.id]: task}));
                
                // Map status to column ID
                const statusToColumnId: Record<string, string> = {
                  'To Do': 'column-1',
                  'In Progress': 'column-2',
                  'Done': 'column-3'
                };
                
                // Update columns to include the new task
                setColumns(prev => {
                  const updatedColumns = {...prev};
                  const taskStatus = (task as any).status || 'To Do';
                  const columnId = statusToColumnId[taskStatus];
                  
                  if (columnId && updatedColumns[columnId]) {
                    // Remove task from all columns first (in case of update)
                    Object.keys(updatedColumns).forEach(colId => {
                      updatedColumns[colId] = {
                        ...updatedColumns[colId],
                        taskIds: updatedColumns[colId].taskIds.filter(id => id !== task.id)
                      };
                    });
                    
                    // Add task to the correct column
                    if (!updatedColumns[columnId].taskIds.includes(task.id)) {
                      updatedColumns[columnId] = {
                        ...updatedColumns[columnId],
                        taskIds: [...updatedColumns[columnId].taskIds, task.id]
                      };
                    }
                  }
                  
                  return updatedColumns;
                });
            }}
            onDeleteTask={(taskId) => {
                const newTasks = {...tasks};
                delete newTasks[taskId];
                setTasks(newTasks);
                const newColumns = {...columns};
                for(const colId in newColumns) {
                    newColumns[colId].taskIds = newColumns[colId].taskIds.filter(id => id !== taskId);
                }
                setColumns(newColumns);
            }}
            onUpdateColumns={setColumns}
            teamMembers={teamMembers}
            onUpdateAssignees={(newAssignees) => {
                setProjects(projects.map(p => p.id === selectedProject.id ? {...p, assignees: newAssignees} : p))
            }}
             onUpdateCommissionHistory={(updatedHistory) => {
                setProjects(projects.map(p => p.id === selectedProject.id ? {...p, commissionHistory: updatedHistory} : p))
            }}
            bankAccounts={bankAccounts}
            initialState={operationDetailInitialState}
            onClearInitialState={() => setOperationDetailInitialState(null)}
            emails={emails}
          />;
        }
        return null;
      case 'clients':
        return <ClientsManager 
          clients={clients} 
          onViewClientDetails={handleViewClientDetails}
          onAddNewClient={() => setActiveView('create-client')}
        />;
      case 'create-client':
        return <CreateClientPage 
          onCancel={() => setActiveView('clients')}
          onSave={handleSaveNewClient}
        />;
      case 'client-detail': {
        const selectedClient = clients.find(c => c.id === selectedClientId);
        if (selectedClient) {
          const isDeletable = !projectsWithRealProgress.some(p => p.clientId === selectedClient.id);
          return <ClientDetailPage
              client={selectedClient}
              onBack={() => { setActiveView('clients'); setSelectedClientId(null); }}
              onUpdateClient={handleUpdateClient}
              onDeleteRequest={() => setClientToDelete(selectedClient)}
              isDeletable={isDeletable}
              projects={projectsWithRealProgress.filter(p => p.clientId === selectedClient.id)}
              onViewOperation={handleViewOperation}
              payments={payments}
              invoices={invoices}
          />;
        }
        return null;
      }
      case 'admin':
        return <AdminPage setActiveView={setActiveView} />;
      case 'company-profile':
        return <CompanyProfilePage setActiveView={setActiveView} />;
      case 'employees':
        return <EmployeesPage
          teamMembers={teamMembers}
          onAddEmployee={handleAddEmployee}
          onUpdateEmployee={handleUpdateEmployee}
          onDeleteEmployee={handleDeleteEmployee}
        />;
      case 'quotations':
        return <QuotationsPage
                    setActiveView={setActiveView}
                    quotations={quotations}
                    onAddQuotation={handleAddQuotation}
                    onUpdateQuotation={handleUpdateQuotation}
                    onDeleteQuotation={handleDeleteQuotation}
                />;
      case 'emails':
        return <EmailClientPage emails={emails} onSendEmail={handleSendEmail} />;
      case 'finance-hub':
        return <FinanceHubPage setActiveView={setActiveView} />;
      case 'finance':
        return <FinanceDashboardPage setActiveView={setActiveView} invoices={invoices} payments={payments} expenses={expenses} />;
      case 'all_expenses':
        return <AllExpensesPage setActiveView={setActiveView} expenses={expenses} projects={projectsWithRealProgress} teamMembers={teamMembers} onAddExpense={exp => setExpenses(prev => [...prev, {...exp, id: `exp-all-${Date.now()}`}])} onUpdateExpense={exp => setExpenses(expenses.map(e => e.id === exp.id ? exp : e))} onDeleteExpense={id => setExpenses(expenses.filter(e => e.id !== id))} bankAccounts={bankAccounts} />;
      case 'all_invoices':
        return <AllInvoicesPage 
                    setActiveView={setActiveView} 
                    invoices={invoices} 
                    payments={payments}
                    projects={projectsWithRealProgress} 
                    onViewOperation={handleViewOperation}
                    onDeleteInvoice={(invoiceId) => setInvoices(invoices.filter(i => i.id !== invoiceId))}
                    onEditInvoice={handleEditInvoice}
                    onViewInvoiceDetail={handleViewInvoiceDetail}
                />;
      case 'all_payments':
        return <AllPaymentsPage setActiveView={setActiveView} payments={payments} invoices={invoices} projects={projectsWithRealProgress} onViewOperation={handleViewOperation} />;
      case 'bank_accounts':
        return <BankAccountsPage
            accounts={bankAccounts}
            payments={payments}
            expenses={expenses}
            onAddAccount={handleAddBankAccount}
            onUpdateAccount={handleUpdateBankAccount}
            onDeleteAccount={handleDeleteBankAccount}
        />;
      case 'bank-reconciliation':
        return <BankReconciliationPage history={reconciliationHistory} setHistory={setReconciliationHistory} />;
      case 'calendar':
        return <CalendarPage
          events={events}
          onAddEvent={e => setEvents(prev => [...prev, { ...e, id: `evt-${Date.now()}` }])}
          onUpdateEvent={e => setEvents(prev => prev.map(ev => ev.id === e.id ? e : ev))}
          onDeleteEvent={id => setEvents(prev => prev.filter(ev => ev.id !== id))}
          emailAccounts={emailAccounts}
          setActiveView={setActiveView}
        />;
      case 'files':
        return <FileManagerPage />;
      case 'integrations':
        return <IntegrationsPage 
                    setActiveView={setActiveView}
                    emailAccounts={emailAccounts}
                    onUpdateEmailAccount={handleUpdateEmailAccount}
                />;
      case 'linked-accounts':
        return <LinkedAccountsPage 
                    accounts={emailAccounts} 
                    emails={emails} 
                    setActiveView={setActiveView} 
                />;
      case 'email-analysis':
        return <EmailAnalysisPage setActiveView={setActiveView} />;
      case 'ai-agents':
        return <AIAgentsPage setActiveView={setActiveView} />;
      case 'ai-operation-creator':
        return <AIOperationCreatorPage
                    setActiveView={setActiveView}
                    emailAccounts={emailAccounts}
                    emails={emails}
                    projects={projects}
                    onCreateOperation={handleCreateOperation}
                />;
      case 'company-hub':
        return <CompanyHubPage setActiveView={setActiveView} />;
      case 'email-hub':
        return <EmailHubPage setActiveView={setActiveView} />;
      case 'notifications-settings':
        return <NotificationsSettingsPage />;
      case 'automations':
        return <AutomationPage setActiveView={setActiveView} />;
      case 'virtual-assistant':
        return <VirtualAssistantConfigPage />;
      case 'task-automation':
        return <TaskAutomationPage />;
      case 'knowledge-base':
        return <KnowledgeBasePage />;
      default:
        return <div className="p-6">{viewTitles[activeView] || 'Not Implemented'}</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        onLogout={onLogout}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopHeader onLogout={onLogout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 md:p-6">
          {renderContent()}
        </main>
      </div>

       <ConfirmationModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => {
          if (clientToDelete) {
            handleDeleteClient(clientToDelete.id);
            setClientToDelete(null);
          }
        }}
        title="Delete Client"
      >
        Are you sure you want to delete client "{clientToDelete?.name}"? This action cannot be undone.
      </ConfirmationModal>
    </div>
  );
};

export default DashboardPage;