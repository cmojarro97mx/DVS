import { Project, Client, TeamMember, Task, Column, EmailAccount, EmailMessage, EmailAttachment, Event, Lead, Quotation, ReconciliationSession, BankTransaction, SatInvoice, BankAccount, Invoice, Payment, Expense, Note, UploadedFile, FileSystemItem } from "../pages/DashboardPage";

export const initialTeamMembers: TeamMember[] = [
  { id: 'tm-1', name: 'Alice Johnson', email: 'alice@nexxio.com', role: 'Operations Manager', status: 'Active', hireDate: '2022-08-15', phone: '123-456-7890' },
  { id: 'tm-2', name: 'Bob Williams', email: 'bob@nexxio.com', role: 'Logistics Coordinator', status: 'Active', hireDate: '2023-01-20', phone: '234-567-8901' },
  { id: 'tm-3', name: 'Charlie Brown', email: 'charlie@nexxio.com', role: 'Sales Representative', status: 'Inactive', hireDate: '2022-11-01', phone: '345-678-9012' },
  { id: 'tm-4', name: 'Diana Prince', email: 'diana@nexxio.com', role: 'Accountant', status: 'Active', hireDate: '2023-03-10', phone: '456-789-0123' },
];

export const initialClients: Client[] = [
  { 
    id: 'client-1', 
    name: 'Global Imports LLC', 
    contactPerson: 'John Doe', 
    email: 'john.doe@globalimports.com', 
    phone: '555-1234', 
    address: '123 Import Lane, Trade City', 
    status: 'Active', 
    currency: 'USD',
    taxInfo: {
      rfc: 'GILL880101ABC',
      taxRegime: '601',
      cfdiUse: 'G03',
      taxAddress: '123 Import Lane, Trade City, 12345, USA',
      // FIX: Added missing postalCode and billingEmail properties to match TaxInfo type.
      postalCode: '12345',
      billingEmail: 'billing@globalimports.com'
    }
  },
  { 
    id: 'client-2', 
    name: 'Manufacturas Nacionales SA', 
    contactPerson: 'Maria Garcia', 
    email: 'maria.g@manufacturas.mx', 
    phone: '555-5678', 
    address: '456 Industrial Park, Mexico City', 
    status: 'Active', 
    currency: 'MXN',
    taxInfo: {
      rfc: 'MANA850515XYZ',
      taxRegime: '601',
      cfdiUse: 'G01',
      taxAddress: 'Av. Industrial 456, Parque Industrial, Ciudad de México, 02000, México',
      // FIX: Added missing postalCode and billingEmail properties to match TaxInfo type.
      postalCode: '02000',
      billingEmail: 'facturacion@manufacturas.mx'
    }
  }
];

export const initialProjects: Project[] = [
    { 
        id: 'OP-USA-001', 
        projectName: 'Electronics Shipment from Shanghai', 
        projectCategory: 'Ocean Freight Impo', 
        startDate: '2024-07-01', 
        deadline: '2024-08-15', 
        status: 'In Transit', 
        assignees: ['Alice Johnson', 'Bob Williams', 'Diana Prince'], 
        progress: 60, 
        operationType: 'Maritime Shipping', 
        insurance: 'Insured', 
        shippingMode: 'Sea Freight', 
        courrier: 'Maersk', 
        bookingTracking: 'MSKU1234567', 
        etd: '2024-07-10', 
        eta: '2024-08-05', 
        pickupDate: '2024-07-05', 
        pickupAddress: 'Shanghai, China', 
        deliveryAddress: 'Long Beach, CA', 
        mbl_awb: 'MBL123', 
        hbl_awb: 'HBL456', 
        notes: 'Handle with care. Client requires weekly updates on vessel location.', 
        clientId: 'client-1',
        currency: 'USD',
        documents: [
            { id: 'doc-1', name: 'Commercial_Invoice_CI-123.pdf', type: 'file', parentId: null, file: { name: 'Commercial_Invoice_CI-123.pdf', type: 'application/pdf', size: 123456, lastModified: Date.now() } as File, preview: '#' },
            { id: 'doc-2', name: 'Packing_List_PL-456.xlsx', type: 'file', parentId: null, file: { name: 'Packing_List_PL-456.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 54321, lastModified: Date.now() } as File, preview: '#' },
            { id: 'doc-3', name: 'container_photo.jpg', type: 'file', parentId: null, file: { name: 'container_photo.jpg', type: 'image/jpeg', size: 987654, lastModified: Date.now() } as File, preview: 'https://placehold.co/600x400/0072C6/FFF/JPEG?text=Container' },
            { id: 'doc-4', name: 'Bill_of_Lading_MBL123.pdf', type: 'file', parentId: null, file: { name: 'Bill_of_Lading_MBL123.pdf', type: 'application/pdf', size: 234567, lastModified: Date.now() } as File, preview: '#' },
            { id: 'doc-5', name: 'shipping_instructions.docx', type: 'file', parentId: null, file: { name: 'shipping_instructions.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 25600, lastModified: Date.now() } as File, preview: '#' },
        ],
        commissionHistory: [],
    },
    { id: 'OP-MEX-002', projectName: 'Auto Parts Delivery to Puebla', projectCategory: 'Inland Freight', startDate: '2024-07-20', deadline: '2024-07-25', status: 'Delivered', assignees: ['Bob Williams'], progress: 100, operationType: 'Land Transportation', insurance: 'Client has own insurance', shippingMode: 'Land Freight', courrier: 'Castores', bookingTracking: 'CAS789123', etd: '2024-07-21', eta: '2024-07-23', pickupDate: '2024-07-21', pickupAddress: 'Monterrey, MX', deliveryAddress: 'Puebla, MX', mbl_awb: 'N/A', hbl_awb: 'N/A', notes: '', clientId: 'client-2', currency: 'MXN', commissionHistory: [] }
];

export const initialNotes: Note[] = [
    {
        id: 'OP-USA-001-note-1',
        author: 'Alice Johnson',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString(),
        content: 'Client confirmed delivery address. All documents are in order for customs pre-clearance.',
    },
    {
        id: 'OP-USA-001-note-2',
        author: 'System',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString(),
        content: 'Vessel "MSC LEO" has departed from Shanghai port. Tracking updated.',
    },
    {
        id: 'OP-USA-001-note-3',
        author: 'Bob Williams',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleString(),
        content: 'Attached is the pre-loading inspection photo. Container seal is intact.',
        attachment: { file: { name: 'inspection_photo.jpg', type: 'image/jpeg', size: 1234567 } as File, preview: 'https://placehold.co/600x400/0072C6/FFF/JPEG?text=Inspection' }
    },
     {
        id: 'OP-USA-001-note-4',
        author: 'Alice Johnson',
        timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toLocaleString(),
        content: 'Received customs clearance confirmation. Waiting for port arrival.',
    },
    {
        id: 'OP-USA-001-note-5',
        author: 'Diana Prince',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleString(),
        content: 'Expense for port handling fees has been registered. Awaiting invoice for customs duties.',
    },
];


export const initialBankAccounts: BankAccount[] = [
    { id: 'ba-1', accountName: 'Primary Checking USD', bankName: 'Global Bank', accountNumber: '...1121', currency: 'USD' },
    { id: 'ba-2', accountName: 'Operational Account MXN', bankName: 'Banco Nacional', accountNumber: '...8890', currency: 'MXN' }
];

export const initialInvoices: Invoice[] = [
    { id: 'inv-1', operationId: 'OP-USA-001', invoiceNumber: 'INV-001', invoiceDate: '2024-07-18', dueDate: '2024-08-18', currency: 'USD', exchangeRate: 1, client: 'Global Imports LLC', bankAccount: 'ba-1', discount: 0, discountType: '%', items: [{id: 'item-1', itemName: 'Ocean Freight & Services', description: 'Container from Shanghai to Long Beach', quantity: 1, unit: 'shipment', unitPrice: 5200, tax: 0, amount: 5200}], subTotal: 5200, taxAmount: 0, total: 5200, status: 'Sent' },
    { id: 'inv-2', operationId: 'OP-MEX-002', invoiceNumber: 'INV-002', invoiceDate: '2024-07-24', dueDate: '2024-08-24', currency: 'MXN', exchangeRate: 17.5, client: 'Manufacturas Nacionales SA', bankAccount: 'ba-2', discount: 0, discountType: '%', items: [{id: 'item-2', itemName: 'Inland Freight', description: 'Trucking from Monterrey to Puebla', quantity: 1, unit: 'trip', unitPrice: 25000, tax: 16, amount: 25000}], subTotal: 25000, taxAmount: 4000, total: 29000, status: 'Paid' },
    { id: 'inv-3', operationId: 'OP-USA-001', invoiceNumber: 'INV-003', invoiceDate: '2024-07-30', dueDate: '2024-08-30', currency: 'USD', exchangeRate: 1, client: 'Global Imports LLC', bankAccount: 'ba-1', discount: 0, discountType: '%', items: [{id: 'item-3', itemName: 'Customs Duties & Fees', description: 'Import duties for electronics shipment', quantity: 1, unit: 'shipment', unitPrice: 1250.75, tax: 0, amount: 1250.75}], subTotal: 1250.75, taxAmount: 0, total: 1250.75, status: 'Sent' },
];

export const initialPayments: Payment[] = [
    { id: 'pay-1', operationId: 'OP-MEX-002', invoiceId: 'inv-2', paymentDate: '2024-07-28', amount: 29000, currency: 'MXN', paymentMethod: 'Bank Transfer', bankAccountId: 'ba-2' },
    { id: 'pay-2', operationId: 'OP-USA-001', invoiceId: 'inv-1', paymentDate: '2024-07-30', amount: 3000, currency: 'USD', paymentMethod: 'Wire Transfer', bankAccountId: 'ba-1' }
];

export const initialExpenses: Expense[] = [
    { id: 'exp-1', operationId: 'OP-USA-001', itemName: 'Port Handling Fees', currency: 'USD', exchangeRate: 1, price: 750, purchaseDate: '2024-07-12', employee: 'Alice Johnson', expenseCategory: 'Port Charges', purchasedFrom: 'Port of Long Beach', bankAccount: 'ba-1' },
    { id: 'exp-2', operationId: 'OP-MEX-002', itemName: 'Diesel Fuel', currency: 'MXN', exchangeRate: 1, price: 8500, purchaseDate: '2024-07-22', employee: 'Bob Williams', expenseCategory: 'Gasoline', purchasedFrom: 'PEMEX Gas Station', bankAccount: 'ba-2' },
    { id: 'exp-3', itemName: 'Office Coffee Supplies', currency: 'USD', exchangeRate: 1, price: 120, purchaseDate: '2024-07-15', employee: 'Diana Prince', expenseCategory: 'Office Supplies', purchasedFrom: 'Office Depot', bankAccount: 'ba-1' },
    { id: 'exp-4', operationId: 'OP-USA-001', itemName: 'Customs Broker Fee', currency: 'USD', exchangeRate: 1, price: 450, purchaseDate: '2024-07-29', employee: 'Alice Johnson', expenseCategory: 'Customs Fees', purchasedFrom: 'US Customs Brokerage', bankAccount: 'ba-1' },
];

export const initialQuotations: Quotation[] = [];
export const initialTasksData: Record<string, Task> = {
    'task-1': { id: 'task-1', operationId: 'OP-USA-001', title: 'Request booking confirmation from Maersk', description: 'Contact Maersk to get the final booking confirmation PDF.', priority: 'High', assignees: ['Alice Johnson'], dueDate: '2024-08-08' },
    'task-2': { id: 'task-2', operationId: 'OP-USA-001', title: 'Verify commercial invoice against packing list', description: 'Ensure all items and quantities match between the two documents.', priority: 'Medium', assignees: ['Bob Williams'], dueDate: '2024-08-09' },
    'task-3': { id: 'task-3', operationId: 'OP-USA-001', title: 'Submit customs declaration', description: 'File the necessary import documents with US customs via our broker.', priority: 'High', assignees: ['Alice Johnson'], dueDate: '2024-08-25' },
    'task-4': { id: 'task-4', operationId: 'OP-USA-001', title: 'Track vessel location weekly', description: 'Provide weekly updates to the client on the vessel\'s progress.', priority: 'Low', assignees: ['Bob Williams'], dueDate: '2024-09-01' },
    'task-5': { id: 'task-5', operationId: 'OP-USA-001', title: 'Confirm container pickup appointment', description: 'Schedule the truck for container pickup at Long Beach port.', priority: 'Medium', assignees: ['Alice Johnson'], dueDate: '2024-09-04' },
    'task-6': { id: 'task-6', operationId: 'OP-MEX-002', title: 'Send delivery confirmation to client', description: 'Email proof of delivery to Manufacturas Nacionales.', priority: 'Low', assignees: ['Bob Williams'], dueDate: '2024-07-26' },
    'task-7': { id: 'task-7', operationId: 'OP-USA-001', title: 'Prepare final invoice for client', description: 'Include all freight costs and additional fees.', priority: 'Medium', assignees: ['Diana Prince'], dueDate: '2024-09-05' },
    'task-8': { id: 'task-8', operationId: 'OP-USA-001', title: 'Arrange final mile delivery', description: 'Book a truck for delivery from Long Beach port to client warehouse.', priority: 'High', assignees: ['Bob Williams'], dueDate: '2024-08-28' },
};

export const initialAccounts: EmailAccount[] = [
    { id: 'acc-1', email: 'sales@nexxio.com', provider: 'gsuite', status: 'connected', syncEmail: true, syncCalendar: true }
];

export const initialEmails: EmailMessage[] = [
    {
        id: 'email-1',
        threadId: 'thread-1',
        accountId: 'acc-1',
        folder: 'inbox',
        from: 'john.doe@globalimports.com',
        fromName: 'John Doe',
        to: ['sales@nexxio.com'],
        subject: 'Inquiry about Shipment OP-USA-001',
        snippet: 'Hi team, could you please provide an update on the ETA for our shipment OP-USA-001? We need to coordinate with our warehouse...',
        body: 'Hi team,\n\nCould you please provide an update on the ETA for our shipment OP-USA-001? We need to coordinate with our warehouse team for receiving.\n\nThanks,\nJohn Doe\nGlobal Imports LLC',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        unread: true,
        starred: true,
        attachments: [],
    },
    {
        id: 'email-2',
        threadId: 'thread-1',
        accountId: 'acc-1',
        folder: 'sent',
        from: 'sales@nexxio.com',
        fromName: 'Alice Johnson',
        to: ['john.doe@globalimports.com'],
        subject: 'Re: Inquiry about Shipment OP-USA-001',
        snippet: 'Hi John, the vessel is currently on schedule. The ETA at Long Beach is still August 5th. I will let you know if anything changes...',
        body: 'Hi John,\n\nThe vessel is currently on schedule. The ETA at Long Beach is still August 5th. I will let you know if anything changes.\n\nBest regards,\nAlice Johnson\nNexxio Operations',
        date: new Date(Date.now() - 1 * 23 * 60 * 60 * 1000).toISOString(),
        unread: false,
        starred: false,
        attachments: [],
    },
    {
        id: 'email-3',
        threadId: 'thread-2',
        accountId: 'acc-1',
        folder: 'inbox',
        from: 'ops@fastforwarder.com',
        fromName: 'Fast Forwarder Ops',
        to: ['sales@nexxio.com'],
        subject: 'Documentation for OP-MEX-002',
        snippet: 'Hello, please find attached the Bill of Lading for the shipment OP-MEX-002. Let us know if you need anything else.',
        body: 'Hello,\n\nPlease find attached the Bill of Lading for the shipment OP-MEX-002. Let us know if you need anything else.\n\nThank you,\nFast Forwarder Team',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        unread: false,
        starred: false,
        attachments: [{ filename: 'Bill_of_Lading_OP-MEX-002.pdf', size: '1.2 MB', url: '#' }],
    },
     {
        id: 'email-4',
        threadId: 'thread-2',
        accountId: 'acc-1',
        folder: 'sent',
        from: 'sales@nexxio.com',
        fromName: 'Bob Williams',
        to: ['ops@fastforwarder.com'],
        subject: 'Re: Documentation for OP-MEX-002',
        snippet: 'Received with thanks. Everything looks correct.',
        body: 'Hi Team,\n\nReceived with thanks. Everything looks correct.\n\nRegards,\nBob Williams\nNexxio',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        unread: false,
        starred: false,
        attachments: [],
    },
    {
        id: 'email-5',
        threadId: 'thread-3',
        accountId: 'acc-1',
        folder: 'inbox',
        from: 'maria.g@manufacturas.mx',
        fromName: 'Maria Garcia',
        to: ['sales@nexxio.com'],
        subject: 'Quick question regarding payment terms',
        snippet: 'Hi, we received invoice INV-002. Can you confirm if we can pay via a different method? Our usual bank is having issues...',
        body: 'Hi,\n\nWe received invoice INV-002. Can you confirm if we can pay via a different method? Our usual bank is having some technical issues today.\n\nThanks,\nMaria',
        date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        unread: true,
        starred: false,
        attachments: [],
    },
    {
        id: 'email-6',
        threadId: 'thread-4',
        accountId: 'acc-1',
        folder: 'sent',
        from: 'sales@nexxio.com',
        fromName: 'Alice Johnson',
        to: ['newlead@prospect.com'],
        subject: 'Your Quotation for Air Freight Services',
        snippet: 'Dear Prospect, Following up on our conversation, please find our quotation for the requested air freight services attached...',
        body: 'Dear Prospect,\n\nFollowing up on our conversation, please find our quotation for the requested air freight services attached.\n\nWe look forward to hearing from you.\n\nSincerely,\nAlice Johnson',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        unread: false,
        starred: false,
        attachments: [{ filename: 'Quotation_Air_Freight_XYZ.pdf', size: '450 KB', url: '#' }],
    },
];

export const initialEvents: Event[] = [];


export const initialColumnsData: Record<string, Column> = {
  'column-1': { id: 'column-1', title: 'To Do', taskIds: ['task-1', 'task-2', 'task-7', 'task-8'] },
  'column-2': { id: 'column-2', title: 'In Progress', taskIds: ['task-3', 'task-4'] },
  'column-3': { id: 'column-3', title: 'Done', taskIds: ['task-5', 'task-6'] },
};
export const initialColumnOrderData: string[] = ['column-1', 'column-2', 'column-3'];


// --- Dummy Data for Bank Reconciliation ---

export const mockBankTransactions: BankTransaction[] = [
    // July
    { id: 'tx-jul-1', date: '2024-07-14', description: 'SPEI to LOGISTICS PROVIDER', amount: 14500.50, type: 'debit' },
    { id: 'tx-jul-2', date: '2024-07-13', description: 'Wire Transfer Gomez Customs', amount: 850.00, type: 'debit' },
    { id: 'tx-jul-3', date: '2024-07-11', description: 'Payroll Payment Q1 JUL', amount: 85000.00, type: 'debit' },
    { id: 'tx-jul-4', date: '2024-07-15', description: 'Deposit from MAJOR CLIENT', amount: 3200.75, type: 'credit' },
    { id: 'tx-jul-5', date: '2024-07-10', description: 'Payment to THE EAGLE INSURANCE', amount: 420.00, type: 'debit' },
     // June
    { id: 'tx-jun-1', date: '2024-06-10', description: 'Transfer to Fast Freight Inc', amount: 8800.00, type: 'debit' },
    { id: 'tx-jun-2', date: '2024-06-15', description: 'Port Maneuvers Payment', amount: 350.00, type: 'debit' },
    { id: 'tx-jun-3', date: '2024-06-20', description: 'Income from Client XYZ', amount: 15000.00, type: 'credit' },
];

export const mockReceivedInvoices: SatInvoice[] = [
    // Original data
    { uuid: 'A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6', issuerName: 'LOGISTICS PROVIDER INC', receiverName: 'NEXXIO', date: '2024-07-14', total: 14500.50, currency: 'MXN', status: 'Vigente', pdfUrl: '#', xmlUrl: '#' },
    { uuid: 'B2C3D4E5-F6G7-H8I9-J0K1-L2M3N4O5P6Q7', issuerName: 'GOMEZ CUSTOMS AGENCY', receiverName: 'NEXXIO', date: '2024-07-13', total: 850.00, currency: 'USD', status: 'Vigente', pdfUrl: '#', xmlUrl: '#' },
    { uuid: 'C3D4E5F6-G7H8-I9J0-K1L2-M3N4O5P6Q7R8', issuerName: 'VELOZ TRANSPORTS INC', receiverName: 'NEXXIO', date: '2024-07-12', total: 25000.00, currency: 'MXN', status: 'Cancelado', pdfUrl: '#', xmlUrl: '#' },
    { uuid: 'F9E8D7C6-B5A4-9382-7160-543210FEDCBA', issuerName: 'THE EAGLE INSURANCE AND BONDS', receiverName: 'NEXXIO', date: '2024-07-10', total: 420.00, currency: 'USD', status: 'Vigente', pdfUrl: '#', xmlUrl: '#' },
    { uuid: 'G8H7I6J5-K4L3-M2N1-O0P9-Q8R7S6T5U4V3', issuerName: 'NORTHERN WAREHOUSING', receiverName: 'NEXXIO', date: '2024-07-09', total: 5500.00, currency: 'MXN', status: 'Vigente', pdfUrl: '#', xmlUrl: '#' },
    { uuid: 'J1K2L3M4-N5O6-P7Q8-R9S0-T1U2V3W4X5Y6', issuerName: 'MONTERREY FAST FREIGHT', receiverName: 'NEXXIO', date: '2024-06-10', total: 8800.00, currency: 'MXN', status: 'Vigente', pdfUrl: '#', xmlUrl: '#' },
    { uuid: 'K2L3M4N5-O6P7-Q8R9-S0T1-U2V3W4X5Y6Z7', issuerName: 'VERACRUZ PORT MANEUVERS', receiverName: 'NEXXIO', date: '2024-06-15', total: 350.00, currency: 'USD', status: 'Vigente', pdfUrl: '#', xmlUrl: '#' },
    { uuid: 'L3M4N5O6-P7Q8-R9S0-T1U2-V3W4X5Y6Z7A8', issuerName: 'TRANSPORTES RAPIDOS DEL SUR', receiverName: 'NEXXIO', date: '2024-06-25', total: 12000.00, currency: 'MXN', status: 'Vigente', pdfUrl: '#', xmlUrl: '#' },
];

export const mockIssuedInvoices: SatInvoice[] = [
    { uuid: 'Z9Y8X7W6-V5U4-T3S2-R1Q0-P9O8N7M6L5K4', issuerName: 'NEXXIO', receiverName: 'MAJOR CLIENT SA DE CV', date: '2024-07-15', total: 3200.75, currency: 'USD', status: 'Vigente', pdfUrl: '#', xmlUrl: '#' },
    { uuid: 'Y8X7W6V5-U4T3-S2R1-Q0P9-O8N7M6L5K4J3', issuerName: 'NEXXIO', receiverName: 'CLIENT XYZ', date: '2024-06-20', total: 15000.00, currency: 'MXN', status: 'Vigente', pdfUrl: '#', xmlUrl: '#' },
];


export const initialReconciliationHistory: ReconciliationSession[] = [
    {
        id: 'session-1',
        date: new Date('2024-07-01T10:00:00Z'),
        status: 'completed',
        summary: {
            reconciledCount: 2,
            unreconciledCount: 0,
            totalTransactions: 3,
            totalDebitTransactions: 2,
            progressPercentage: 100,
            reconciledAmount: 9150.00,
        },
        data: {
            transactions: mockBankTransactions.filter(tx => new Date(tx.date).getMonth() === 5), // June
            reconciliationMap: new Map([
                ['tx-jun-1', 'J1K2L3M4-N5O6-P7Q8-R9S0-T1U2V3W4X5Y6'],
                ['tx-jun-2', 'K2L3M4N5-O6P7-Q8R9-S0T1-U2V3W4X5Y6Z7'],
            ]),
            bankStatements: [{ name: 'June_2024_Statement.pdf', size: 204800 }],
            reconciliationMonth: new Date('2024-06-01T00:00:00Z'),
        }
    },
    {
        id: 'session-2',
        date: new Date('2024-06-01T10:00:00Z'),
        status: 'saved',
        summary: {
            reconciledCount: 1,
            unreconciledCount: 1,
            totalTransactions: 2,
            totalDebitTransactions: 2,
            progressPercentage: 100,
            reconciledAmount: 12000.00,
        },
        data: {
            transactions: [],
            reconciliationMap: new Map(),
            bankStatements: [],
            reconciliationMonth: new Date('2024-05-01T00:00:00Z'),
        }
    }
];