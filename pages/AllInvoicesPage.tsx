import React, { useState, useEffect, useMemo } from 'react';
import { View } from './DashboardPage';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { InvoicesIcon } from '../components/icons/InvoicesIcon';
import { Banner } from '../components/Banner';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ShipNowIcon } from '../components/icons/ShipNowIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { ChevronUpDownIconSimple } from '../components/icons/ChevronUpDownIcon';
import { ProjectAvatar } from '../components/ProjectAvatar';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { TruckIcon } from '../components/icons/TruckIcon';
import { ShipIcon } from '../components/icons/ShipIcon';
import { invoicesService } from '../src/services/invoicesService';
import { paymentsService } from '../src/services/paymentsService';
import { operationsService } from '../src/services/operationsService';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  discount: number;
  discountType: string;
  subTotal: number;
  taxAmount: number;
  total: number;
  status: string;
  client: string;
  billingAddress?: string;
  operationId: string;
  items: Array<{
    id: string;
    itemName: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: string;
}

interface Operation {
  id: string;
  projectName: string;
  pickupAddress: string;
  deliveryAddress: string;
  etd: string;
  eta: string;
  shippingMode: string;
}

interface AllInvoicesPageProps {
  setActiveView: (view: View) => void;
  onViewOperation: (projectId: string) => void;
  onEditInvoice: (invoiceId: string, operationId: string) => void;
  onViewInvoiceDetail: (invoiceId: string, operationId: string) => void;
}

type EnrichedInvoice = Invoice & { balance: number; status: 'Paid' | 'Overdue' | 'Sent' | 'Draft' | 'Canceled' };

const MapPinIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const AirplaneLogisticsIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

const WorldMapBackgroundIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 1024 541" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M883.33 306.963C883.33 306.963 943.91 261.643 931.33 241.963C918.75 222.283 859.25 259.803 859.25 259.803L832.67 246.643L828.08 214.723L838.25 200.443L844.92 195.763L841.58 181.483L806.25 186.163L801.67 171.883L750.25 169.543L743.58 152.923L721.25 142.123L721.25 130.483L698.92 121.123L671.25 129.343L662.08 111.763L651.92 110.623L647.33 118.843L645 107.203L638.25 103.723L617.83 110.623L607.67 101.383L589.67 107.203L585.08 97.9633H563.75L560.42 108.763L547.83 103.723L537.67 114.043L524.17 106.063L511.58 108.763L506 99.5233L491.42 103.723L481.25 90.8833L458.92 92.4433L464.5 83.2033L454.33 77.3833L429.08 81.0433L425.75 67.8833L413.17 66.7633L409.83 59.0833L393.92 63.3433L393.92 51.9433L383.75 49.6033L369.08 59.0833L360.92 50.7433L345 54.2233L347.33 42.5833L336.5 39.1033L327.33 46.0633L317.17 32.0233H297.17L274.83 48.4033L262.25 42.5833L237 57.9433L220.25 48.4033L208.58 55.3633L206.25 47.2633L191.67 49.6033L187.08 42.5833L158.42 49.6033L153.83 39.1033L135.83 43.7233L130.25 34.3633L101.58 40.2433L92.42 27.4033H65.83L62.5 35.5033L47.58 29.7433L44.25 35.5033L35.08 41.3833L42.58 57.9433L35.08 61.3033L29.5 54.2233L2.5 81.0433V103.723L3.67 122.263L22.83 133.903L26.17 151.783L38.42 169.543L44.25 178.903L29.5 190.543L39.58 204.043L30.67 213.583L37.25 235.123L17.25 253.963L25 264.043L51.58 274.123L62.5 299.803L129.08 303.463L166.58 340.963L181.5 348.103L203.83 340.963L232.5 358.843L244.17 383.323L239.58 393.043L247.5 401.623L282.83 397.783L305.17 416.323L311.83 440.803L334.17 460.483L391.58 472.123L432.42 450.043L442.25 457.003L457.75 451.183L469.08 433.603L537.67 421.963L560.42 391.843L585.08 384.463L613.75 385.603L642.67 368.503L703.5 366.163L724.58 344.623L757.92 344.623L797.08 316.543L822.33 318.883L883.33 306.963Z"/>
    </svg>
);


// This component is defined but not used in the main view.
// Kept for code consistency.
const AirplaneIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);
  
const GlobeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.25 9.75h17.5M4.5 14.25h15M10.5 3.25c1.5 4 1.5 10 0 17.5M13.5 3.25c-1.5 4-1.5 10 0 17.5" />
    </svg>
);

const AtSymbolIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
    </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
  </svg>
);

const BuildingOfficeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
);


const InvoicePreview: React.FC<{
    invoice: Invoice;
    project: Operation;
    payments: Payment[];
    onBack: () => void;
    onEdit: () => void;
    onDelete?: () => void;
}> = ({ invoice, project, payments, onBack, onEdit, onDelete }) => {
    
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = invoice.total - paidAmount;
    
    const getStatusInfo = () => {
        if (balance <= 0 && invoice.status !== 'Canceled') {
            return { status: 'Paid', classes: 'bg-green-100 text-green-800' };
        }
        if (new Date(invoice.dueDate) < new Date() && invoice.status !== 'Canceled' && balance > 0) {
            return { status: 'Overdue', classes: 'bg-red-100 text-red-800' };
        }
        switch (invoice.status) {
            case 'Sent': return { status: 'Sent', classes: 'bg-blue-100 text-blue-800' };
            case 'Canceled': return { status: 'Canceled', classes: 'bg-gray-200 text-gray-600' };
            case 'Draft': default: return { status: 'Draft', classes: 'bg-yellow-100 text-yellow-800' };
        }
    };

    const statusInfo = getStatusInfo();
    const formatCurrencyPreview = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(amount);
    const qrData = encodeURIComponent(`Invoice #: ${invoice.invoiceNumber}\nTotal: ${formatCurrencyPreview(invoice.total)}\nClient: ${invoice.client}`);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}&qzone=1&color=1F2937`;

    return (
        <div className="space-y-6 animate-fade-in">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area { position: absolute; left: 0; top: 0; width: 100%; height: 100%; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
                    .no-print { display: none; }
                }
            `}</style>

            <div className="flex justify-between items-center no-print">
                 <button onClick={onBack} className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50 bg-white border-gray-300">
                        <PrinterIcon className="w-4 h-4"/> Print / PDF
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm printable-area overflow-hidden relative">
                <div className="absolute inset-0 z-0 no-print overflow-hidden">
                    <WorldMapBackgroundIcon className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] text-gray-50 opacity-60" />
                </div>
                <div className="relative z-10">
                    <header className="bg-slate-800/95 backdrop-blur-sm text-white rounded-t-xl p-8 border-b-4 border-red-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <ShipNowIcon className="w-10 h-10 mb-2"/>
                                <h1 className="text-xl font-bold tracking-tight">{project.projectName}</h1>
                                <p className="text-xs text-slate-300 font-mono">{project.id}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-4xl font-extrabold tracking-wider">INVOICE</h2>
                                <div className={`mt-2 inline-block px-3 py-1 text-sm font-bold rounded-full bg-white bg-opacity-20 text-white`}>
                                    {statusInfo.status.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="p-8">
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase">BILL TO</p>
                                <p className="font-bold text-gray-800 mt-2">{invoice.client}</p>
                                {invoice.billingAddress && <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{invoice.billingAddress}</p>}
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr><td className="font-semibold text-slate-600 py-1 pr-4">Invoice Number:</td><td className="font-bold text-slate-800 py-1">{invoice.invoiceNumber}</td></tr>
                                        <tr><td className="font-semibold text-slate-600 py-1 pr-4">Invoice Date:</td><td className="text-slate-800 py-1">{invoice.invoiceDate}</td></tr>
                                        <tr><td className="font-semibold text-slate-600 py-1 pr-4">Due Date:</td><td className="text-slate-800 py-1">{invoice.dueDate}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                         <section className="mb-8 p-4 bg-slate-50/70 rounded-lg border border-slate-200">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Shipment Journey</h3>
                            <div className="flex items-center justify-between">
                                <div className="w-1/3 text-center">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Origin</p>
                                    <p className="font-semibold text-gray-800 mt-1">{project.pickupAddress}</p>
                                    <p className="text-xs text-gray-500 mt-1">ETD: {project.etd}</p>
                                </div>
                                <div className="flex-grow flex items-center justify-center px-4">
                                    <TruckIcon className="w-5 h-5 text-gray-400 flex-shrink-0"/>
                                    <div className="flex-grow border-t-2 border-dashed border-gray-300 mx-2"></div>
                                    { (project.shippingMode || '').toLowerCase().includes('sea') ? <ShipIcon className="w-7 h-7 text-blue-600 flex-shrink-0" /> : <AirplaneLogisticsIcon className="w-7 h-7 text-blue-600 flex-shrink-0" /> }
                                    <div className="flex-grow border-t-2 border-dashed border-gray-300 mx-2"></div>
                                    <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0"/>
                                </div>
                                 <div className="w-1/3 text-center">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Destination</p>
                                    <p className="font-semibold text-gray-800 mt-1">{project.deliveryAddress}</p>
                                    <p className="text-xs text-gray-500 mt-1">ETA: {project.eta}</p>
                                </div>
                            </div>
                        </section>
                        
                        <section>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="p-3 text-left font-semibold text-slate-600 uppercase text-xs">Description</th>
                                        <th className="p-3 w-24 text-right font-semibold text-slate-600 uppercase text-xs">Qty</th>
                                        <th className="p-3 w-32 text-right font-semibold text-slate-600 uppercase text-xs">Unit Price</th>
                                        <th className="p-3 w-32 text-right font-semibold text-slate-600 uppercase text-xs">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map(item => (
                                        <tr key={item.id} className="border-b border-slate-200">
                                            <td className="p-3 align-top"><p className="font-semibold text-slate-800">{item.itemName}</p>{item.description && <p className="text-slate-600 text-xs mt-1">{item.description}</p>}</td>
                                            <td className="p-3 text-right align-top">{item.quantity}</td>
                                            <td className="p-3 text-right align-top">{formatCurrencyPreview(item.unitPrice)}</td>
                                            <td className="p-3 text-right font-semibold align-top">{formatCurrencyPreview(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                        
                        <section className="flex flex-col md:flex-row justify-between mt-8">
                            <div className="w-full md:w-1/2 mb-8 md:mb-0 text-sm">
                               <h4 className="font-semibold text-gray-500 mb-2 uppercase text-xs">Payment Information</h4>
                               <p className="text-gray-600">Please make payment to the account details provided separately. Use the invoice number as the payment reference.</p>
                               <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 mt-4 opacity-80" />
                            </div>
                            <div className="w-full md:w-auto md:min-w-[350px] space-y-2 text-sm">
                                <div className="flex justify-between p-2 rounded-md"><span className="text-gray-600">Subtotal</span><span className="font-medium text-gray-800">{formatCurrencyPreview(invoice.subTotal)}</span></div>
                                {invoice.discount > 0 && <div className="flex justify-between p-2 rounded-md"><span className="text-gray-600">Discount ({invoice.discountType === '%' ? `${invoice.discount}%` : 'flat'})</span><span>- {formatCurrencyPreview(invoice.discountType === 'flat' ? invoice.discount : invoice.subTotal * (invoice.discount / 100))}</span></div>}
                                <div className="flex justify-between p-2 rounded-md"><span className="text-gray-600">Tax</span><span className="font-medium text-gray-800">{formatCurrencyPreview(invoice.taxAmount)}</span></div>
                                <div className="flex justify-between font-bold text-base p-2 rounded-md bg-slate-100"><span className="text-gray-800">Total ({invoice.currency})</span><span>{formatCurrencyPreview(invoice.total)}</span></div>
                                {paidAmount > 0 && <div className="flex justify-between text-green-700 p-2"><span className="font-medium">Amount Paid</span><span className="font-medium">- {formatCurrencyPreview(paidAmount)}</span></div>}
                                <div className="!mt-3 flex justify-between font-bold text-lg p-4 bg-blue-600 text-white rounded-lg"><span className="">Balance Due</span><span>{formatCurrencyPreview(balance)}</span></div>
                            </div>
                        </section>
        
                         <footer className="mt-12 pt-6 border-t border-slate-200 text-center">
                            <p className="text-sm font-semibold text-gray-800">Thank you for your business!</p>
                            <p className="text-xs text-gray-500 mt-1">If you have any questions, please contact our support team.</p>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};


const StatCard: React.FC<{ title: string; value: string; description: string; color: string }> = ({ title, value, description, color }) => (
    <div className={`p-5 rounded-xl border-l-4 ${color}`}>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
);

const AllInvoicesPage: React.FC<AllInvoicesPageProps> = ({ setActiveView, onViewOperation, onEditInvoice, onViewInvoiceDetail }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState<{ key: keyof EnrichedInvoice; direction: 'ascending' | 'descending' } | null>({ key: 'invoiceDate', direction: 'descending' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [invoicesData, paymentsData, operationsData] = await Promise.all([
                invoicesService.getAll(),
                paymentsService.getAll(),
                operationsService.getAll()
            ]);
            setInvoices(invoicesData as any);
            setPayments(paymentsData as any);
            setOperations(operationsData as any);
        } catch (error) {
            console.error('Error loading invoices data:', error);
        } finally {
            setLoading(false);
        }
    };

    const projectMap = useMemo(() => new Map(operations.map(p => [p.id, p.projectName])), [operations]);

    const enrichedInvoices = useMemo((): EnrichedInvoice[] => {
        return invoices.map(inv => {
            const relatedPayments = payments.filter(p => p.invoiceId === inv.id);
            const paidAmount = relatedPayments.reduce((sum, p) => sum + p.amount, 0);
            const balance = inv.total - paidAmount;
            
            let status: EnrichedInvoice['status'] = inv.status;
            if (balance <= 0 && inv.status !== 'Canceled') {
                status = 'Paid';
            } else if (new Date(inv.dueDate) < new Date() && inv.status !== 'Canceled' && balance > 0) {
                status = 'Overdue';
            }

            return { ...inv, balance, status };
        });
    }, [invoices, payments]);

     const summaryStats = useMemo(() => {
        const mainCurrency = 'USD'; // Simplified for display
        const totalInvoiced = enrichedInvoices.reduce((acc, inv) => acc + inv.total, 0);
        const totalOutstanding = enrichedInvoices.reduce((acc, inv) => acc + inv.balance, 0);
        const totalOverdue = enrichedInvoices.filter(inv => inv.status === 'Overdue').reduce((acc, inv) => acc + inv.balance, 0);
        return { totalInvoiced, totalOutstanding, totalOverdue, mainCurrency };
    }, [enrichedInvoices]);

    const sortedAndFilteredInvoices = useMemo(() => {
        let sortableItems = [...enrichedInvoices];

        if (statusFilter !== 'All') {
            sortableItems = sortableItems.filter(inv => inv.status === statusFilter);
        }

        const lowercasedQuery = searchQuery.toLowerCase().trim();
        if (lowercasedQuery) {
            sortableItems = sortableItems.filter(inv => 
                inv.invoiceNumber.toLowerCase().includes(lowercasedQuery) ||
                inv.client.toLowerCase().includes(lowercasedQuery) ||
                (projectMap.get(inv.operationId) || '').toLowerCase().includes(lowercasedQuery)
            );
        }
        
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [enrichedInvoices, statusFilter, searchQuery, sortConfig, projectMap]);

    const requestSort = (key: keyof EnrichedInvoice) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const confirmDelete = async () => {
        if (invoiceToDelete) {
            try {
                await invoicesService.delete(invoiceToDelete.id);
                await loadData();
                setInvoiceToDelete(null);
            } catch (error) {
                console.error('Error deleting invoice:', error);
            }
        }
    };

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Sent': return 'bg-blue-100 text-blue-800';
            case 'Overdue': return 'bg-red-100 text-red-800';
            case 'Canceled': return 'bg-gray-100 text-gray-600';
            case 'Draft': default: return 'bg-yellow-100 text-yellow-800';
        }
    };
    
    const formatCurrency = (amount: number, currency: string) => 
        new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    
    const SortableHeader: React.FC<{ sortKey: keyof EnrichedInvoice; children: React.ReactNode }> = ({ sortKey, children }) => (
        <button className="flex items-center gap-2 group" onClick={() => requestSort(sortKey)}>
            {children}
            <ChevronUpDownIconSimple className={`w-4 h-4 transition-colors ${sortConfig?.key === sortKey ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-600'}`} />
        </button>
    );

    if (loading) {
        return (
            <div className="animate-fade-in space-y-6">
                <Banner
                    title="All Invoices"
                    description="Track all invoices, their statuses, and associated operations."
                    icon={InvoicesIcon}
                />
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading invoices...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <Banner
                title="All Invoices"
                description="Track all invoices, their statuses, and associated operations."
                icon={InvoicesIcon}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard title="Total Invoiced" value={formatCurrency(summaryStats.totalInvoiced, summaryStats.mainCurrency)} description="Sum of all invoice totals" color="border-blue-500 bg-blue-50" />
                <StatCard title="Total Outstanding" value={formatCurrency(summaryStats.totalOutstanding, summaryStats.mainCurrency)} description="Total balance due from clients" color="border-yellow-500 bg-yellow-50" />
                <StatCard title="Total Overdue" value={formatCurrency(summaryStats.totalOverdue, summaryStats.mainCurrency)} description="Sum of balances for overdue invoices" color="border-red-500 bg-red-50" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        {['All', 'Paid', 'Overdue', 'Sent', 'Draft'].map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${statusFilter === status ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>{status}</button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-72">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search invoices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>
                {sortedAndFilteredInvoices.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                             <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 font-semibold"><SortableHeader sortKey="invoiceNumber">Invoice</SortableHeader></th>
                                    <th className="px-6 py-3 font-semibold">Client & Operation</th>
                                    <th className="px-6 py-3 font-semibold"><SortableHeader sortKey="dueDate">Due Date</SortableHeader></th>
                                    <th className="px-6 py-3 font-semibold text-right"><SortableHeader sortKey="total">Total</SortableHeader></th>
                                    <th className="px-6 py-3 font-semibold text-right"><SortableHeader sortKey="balance">Balance</SortableHeader></th>
                                    <th className="px-6 py-3 font-semibold text-center"><SortableHeader sortKey="status">Status</SortableHeader></th>
                                    <th className="px-6 py-3 font-semibold text-center">Actions</th>
                                </tr>
                             </thead>
                             <tbody className="text-gray-700">
                                {sortedAndFilteredInvoices.map(inv => (
                                    <tr key={inv.id} className="border-b border-gray-200 hover:bg-gray-50/70 transition-colors">
                                        <td className="px-6 py-4 font-bold text-blue-600">{inv.invoiceNumber}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <ProjectAvatar projectName={projectMap.get(inv.operationId) || 'P'} />
                                                <div>
                                                    <p className="font-medium text-gray-800">{inv.client}</p>
                                                    <button onClick={(e) => { e.stopPropagation(); onViewOperation(inv.operationId); }} className="text-xs text-blue-600 hover:underline">
                                                        {projectMap.get(inv.operationId) || inv.operationId}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{inv.dueDate}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 text-right">{formatCurrency(inv.total, inv.currency)} <span className="text-xs text-gray-500">{inv.currency}</span></td>
                                        <td className="px-6 py-4 font-bold text-red-600 text-right">{formatCurrency(inv.balance, inv.currency)} <span className="text-xs text-gray-500">{inv.currency}</span></td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClasses(inv.status)}`}>{inv.status}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => onViewInvoiceDetail(inv.id, inv.operationId)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200/60" title="View Details"><EyeIcon className="w-5 h-5"/></button>
                                                <button onClick={(e) => { e.stopPropagation(); setInvoiceToDelete(inv); }} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200/60" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                     </div>
                ) : (
                    <div className="text-center bg-gray-50/75 border-t py-20 flex flex-col items-center justify-center">
                        <div className="bg-gray-200 rounded-full p-5">
                            <InvoicesIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="mt-6 text-lg font-semibold text-gray-800">No Invoices Found</h3>
                        <p className="mt-1 text-sm text-gray-500">No invoices match your current filters.</p>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={!!invoiceToDelete}
                onClose={() => setInvoiceToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Invoice"
            >
                Are you sure you want to delete invoice "{invoiceToDelete?.invoiceNumber}"? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
};

export default AllInvoicesPage;