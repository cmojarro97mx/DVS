import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Invoice, InvoiceItem, Payment, Client, Currency, BankAccount, Project } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { DragHandleIcon } from '../components/icons/DragHandleIcon';
import { XIcon } from '../components/icons/XIcon';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { ShipNowIcon } from '../components/icons/ShipNowIcon';
import { ChartPieIcon } from '../components/icons/ChartPieIcon';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { TruckIcon } from '../components/icons/TruckIcon';
import { ShipIcon } from '../components/icons/ShipIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { EyeIcon } from '../components/icons/EyeIcon';


interface InvoicesManagerProps {
  operationId: string;
  invoices: Invoice[];
  payments: Payment[];
  onAddInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  project: Project;
  client?: Client;
  bankAccounts: BankAccount[];
  initialEditInvoiceId?: string;
  initialViewInvoiceId?: string;
  onInitialIntentConsumed: () => void;
}

const formatCurrency = (amount: number, currency: string) => 
    `${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;

const InvoiceForm: React.FC<Omit<InvoicesManagerProps, 'invoices' | 'payments' | 'initialEditInvoiceId' | 'initialViewInvoiceId' | 'onInitialIntentConsumed' | 'project'> & { onCancel: () => void; invoiceToEdit: Invoice | null }> = ({
    operationId, onAddInvoice, onUpdateInvoice, onCancel, invoiceToEdit, client, bankAccounts
}) => {
    
    const [formData, setFormData] = useState({
        invoiceNumber: `INV-${Math.floor(Math.random() * 90000) + 10000}`, 
        invoiceDate: new Date().toISOString().split('T')[0], 
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        currency: 'USD' as Currency, 
        exchangeRate: 1,
        client: '', 
        bankAccount: '', 
        generatedBy: 'John Doe', // Simulated logged-in user
        billingAddress: '', 
        discount: 0, 
        discountType: '%' as '%' | 'flat',
        paymentDetails: '',
    });
    
    const [items, setItems] = useState<Omit<InvoiceItem, 'id' | 'amount'>[]>([
        { itemName: '', description: '', quantity: 1, unit: 'SERVICE UNIT', unitPrice: 0, tax: 0 },
    ]);

    const calculateTotals = useCallback(() => {
        const subTotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
        let discountAmount = 0;
        if (formData.discountType === '%') {
            discountAmount = subTotal * (formData.discount / 100);
        } else {
            discountAmount = formData.discount;
        }

        const taxAmount = items.reduce((acc, item) => {
             const itemTotalable = item.quantity * item.unitPrice;
             return acc + (itemTotalable * (item.tax / 100));
        }, 0);

        const total = subTotal - discountAmount + taxAmount;
        
        return { subTotal, discountAmount, taxAmount, total };

    }, [items, formData.discount, formData.discountType]);

    const [totals, setTotals] = useState(calculateTotals());

    useEffect(() => {
        setTotals(calculateTotals());
    }, [calculateTotals]);

    useEffect(() => {
        if (invoiceToEdit) {
            setFormData({
                invoiceNumber: invoiceToEdit.invoiceNumber,
                invoiceDate: invoiceToEdit.invoiceDate,
                dueDate: invoiceToEdit.dueDate,
                currency: invoiceToEdit.currency,
                exchangeRate: invoiceToEdit.exchangeRate,
                client: invoiceToEdit.client,
                bankAccount: invoiceToEdit.bankAccount || (bankAccounts.length > 0 ? bankAccounts[0].id : ''),
                generatedBy: invoiceToEdit.generatedBy || 'John Doe',
                billingAddress: invoiceToEdit.billingAddress || '',
                discount: invoiceToEdit.discount,
                discountType: invoiceToEdit.discountType,
                paymentDetails: invoiceToEdit.paymentDetails || '',
            });
            setItems(invoiceToEdit.items.map(({id, amount, ...rest}) => rest));
        } else if (client) {
            setFormData(f => ({
                ...f,
                client: client.name,
                currency: client.currency || 'USD',
                billingAddress: `${client.taxInfo?.rfc || ''}\n${client.taxInfo?.taxAddress || ''}\nRegime: ${client.taxInfo?.taxRegime || ''}`,
                bankAccount: bankAccounts.length > 0 ? bankAccounts[0].id : '',
            }));
        }
    }, [invoiceToEdit, client, bankAccounts]);


    const handleItemChange = (index: number, field: keyof Omit<InvoiceItem, 'id' | 'amount'>, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index] };
        (item as any)[field] = value;
        
        if (field === 'quantity' || field === 'unitPrice') {
             if (value < 0) (item as any)[field] = 0;
        }
        
        newItems[index] = item;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { itemName: '', description: '', quantity: 1, unit: 'SERVICE UNIT', unitPrice: 0, tax: 0 }]);
    };
    
    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalItems: InvoiceItem[] = items.map((item, index) => ({
            ...item,
            id: invoiceToEdit?.items[index]?.id || `item-${new Date().getTime()}-${index}`,
            amount: item.quantity * item.unitPrice,
        }));
        
        const invoiceData = {
            operationId,
            ...formData,
            items: finalItems,
            subTotal: totals.subTotal,
            taxAmount: totals.taxAmount,
            total: totals.total,
            status: invoiceToEdit?.status || 'Draft',
        } as Omit<Invoice, 'id'>;

        if (invoiceToEdit) {
            onUpdateInvoice({ ...invoiceData, id: invoiceToEdit.id });
        } else {
            onAddInvoice(invoiceData);
        }
    };
    
    const inputClasses = "w-full bg-gray-50 border-gray-300 rounded-md shadow-sm text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500";
    const labelClasses = "text-xs font-medium text-gray-600";
    
    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{invoiceToEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
                <button type="button" onClick={onCancel} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to list
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClasses}>Billed To</label>
                    <div className="mt-1 p-3 bg-gray-100 rounded-lg border border-gray-200">
                        <p className="font-bold text-gray-800">{client?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{client?.taxInfo?.rfc}</p>
                        <p className="text-xs text-gray-500">{client?.taxInfo?.taxAddress}</p>
                        <p className="text-xs text-gray-500">Regime: {client?.taxInfo?.taxRegime} - {client?.taxInfo?.cfdiUse}</p>
                    </div>
                </div>
                 <div>
                    <div className="grid grid-cols-2 gap-4">
                         <div><label className={labelClasses}>Invoice # *</label><input type="text" value={formData.invoiceNumber} onChange={e => setFormData(f => ({...f, invoiceNumber: e.target.value}))} className={inputClasses} required /></div>
                         <div><label className={labelClasses}>Generated By</label><input type="text" value={formData.generatedBy} readOnly className={inputClasses + " bg-gray-200"} /></div>
                         <div><label className={labelClasses}>Invoice Date</label><input type="date" value={formData.invoiceDate} onChange={e => setFormData(f => ({...f, invoiceDate: e.target.value}))} className={inputClasses} /></div>
                         <div><label className={labelClasses}>Due Date</label><input type="date" value={formData.dueDate} onChange={e => setFormData(f => ({...f, dueDate: e.target.value}))} className={inputClasses} /></div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50/70 p-4 rounded-lg border border-gray-200/80">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClasses}>Currency</label>
                        <input type="text" value={formData.currency} readOnly className={inputClasses + " bg-gray-200 font-bold"} />
                    </div>
                    <div><label className={labelClasses}>Exchange Rate *</label><input type="number" step="0.01" value={formData.exchangeRate} onChange={e => setFormData(f => ({...f, exchangeRate: parseFloat(e.target.value)}))} className={inputClasses + " [color-scheme:light]"} /></div>
                    <div className="md:col-span-2">
                        <label className={labelClasses}>Deposit to Bank Account</label>
                        <select name="bankAccount" value={formData.bankAccount} onChange={e => setFormData(f => ({...f, bankAccount: e.target.value}))} className={inputClasses}>
                            <option value="" disabled>Select an account</option>
                            {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.accountName} ({acc.currency})</option>)}
                        </select>
                    </div>
                 </div>
            </div>

            <div className="space-y-3">
                <h3 className="font-bold text-gray-800">Items</h3>
                <div className="grid grid-cols-[1fr,100px,120px,80px,100px,40px] gap-3 font-semibold text-xs text-gray-500 px-2">
                    <span>Description</span>
                    <span className="text-right">Quantity</span>
                    <span className="text-right">Unit Price</span>
                    <span className="text-center">Tax %</span>
                    <span className="text-right">Amount</span>
                    <span></span>
                </div>
                {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1fr,100px,120px,80px,100px,40px] gap-3 items-start py-2 group hover:bg-gray-50/70 rounded-md">
                        <textarea placeholder="Service description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className={inputClasses + " text-sm"} rows={2}></textarea>
                        <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} className={inputClasses + " text-right [color-scheme:light]"} />
                        <input type="number" step="0.01" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} className={inputClasses + " text-right [color-scheme:light]"} />
                        <input type="number" value={item.tax} onChange={e => handleItemChange(index, 'tax', parseFloat(e.target.value))} className={inputClasses + " text-right [color-scheme:light]"} />
                        <div className="flex items-center justify-end h-9 px-2 bg-gray-100 rounded-md text-sm font-semibold">{(item.quantity * item.unitPrice).toFixed(2)}</div>
                        <div className="flex items-center h-9">
                            <button type="button" onClick={() => removeItem(index)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><XIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addItem} className="flex items-center text-blue-600 font-semibold text-sm hover:underline pt-2"><PlusCircleIcon className="w-5 h-5 mr-2" />Add Item</button>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Sub Total</span><span className="text-sm font-semibold text-gray-800">{totals.subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Discount</span>
                        <div className="flex gap-1">
                            <input type="number" value={formData.discount} onChange={e => setFormData(f => ({...f, discount: parseFloat(e.target.value) || 0}))} className="w-20 text-right border-gray-300 rounded-md shadow-sm text-sm text-gray-900 bg-gray-50 [color-scheme:light]" />
                            <select value={formData.discountType} onChange={e => setFormData(f => ({...f, discountType: e.target.value as any}))} className="border-gray-300 rounded-md shadow-sm text-sm h-full py-0 pl-2 pr-7 text-gray-900 bg-gray-50">
                                <option value="%">%</option>
                                <option value="flat">flat</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Tax</span><span className="text-sm font-semibold text-gray-800">{totals.taxAmount.toFixed(2)}</span></div>
                    <div className="border-t my-2"></div>
                    <div className="flex justify-between items-center"><span className="text-lg font-bold text-gray-800">Total ({formData.currency})</span><span className="text-lg font-bold text-gray-800">{totals.total.toFixed(2)}</span></div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onCancel} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Invoice</button>
            </div>
        </form>
    );
};

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


const InvoicePreview: React.FC<{
    invoice: Invoice;
    project: Project;
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


const DonutChart: React.FC<{ data: { status: string, count: number, color: string }[], total: number }> = ({ data, total }) => {
    const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
    const circumference = 2 * Math.PI * 45; // r=45
    let offset = 0;

    return (
        <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {data.map(segment => {
                    const percentage = (segment.count / total) * 100;
                    const dash = (percentage / 100) * circumference;
                    const strokeDashoffset = offset;
                    offset -= dash;
                    return (
                        <circle
                            key={segment.status}
                            cx="50" cy="50" r="45"
                            fill="transparent"
                            stroke={segment.color}
                            strokeWidth="10"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={strokeDashoffset}
                            onMouseEnter={() => setHoveredSegment(segment.status)}
                            onMouseLeave={() => setHoveredSegment(null)}
                            className="transition-all duration-300 origin-center"
                            style={{ transform: hoveredSegment === segment.status ? 'scale(1.05)' : 'scale(1)' }}
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                 {hoveredSegment ? (
                    <>
                        <span className="text-2xl font-bold text-gray-800">{data.find(d => d.status === hoveredSegment)?.count}</span>
                        <span className="text-xs text-gray-500">{hoveredSegment}</span>
                    </>
                 ) : (
                    <>
                        <span className="text-2xl font-bold text-gray-800">{total}</span>
                        <span className="text-xs text-gray-500">Total Invoices</span>
                    </>
                 )}
            </div>
        </div>
    );
};


const InvoicesSummary: React.FC<{ invoices: Invoice[], payments: Payment[] }> = ({ invoices, payments }) => {
    const summary = useMemo(() => {
        const totalsByCurrency: Record<string, number> = invoices.reduce((acc, inv) => {
            acc[inv.currency] = (acc[inv.currency] || 0) + inv.total;
            return acc;
        }, {} as Record<string, number>);

        const paidByCurrency: Record<string, number> = payments.reduce((acc, p) => {
            acc[p.currency] = (acc[p.currency] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);

        const allCurrencies = [...new Set([...Object.keys(totalsByCurrency), ...Object.keys(paidByCurrency)])];

        const financialData = allCurrencies.map(currency => ({
            currency,
            totalInvoiced: totalsByCurrency[currency] || 0,
            totalPaid: paidByCurrency[currency] || 0,
            balance: (totalsByCurrency[currency] || 0) - (paidByCurrency[currency] || 0)
        }));

        const statusCounts = invoices.reduce((acc, inv) => {
            const currentStatus = inv.status;
            acc[currentStatus] = (acc[currentStatus] || 0) + 1;
            return acc;
        }, {} as Record<Invoice['status'], number>);
        
        return { financialData, statusCounts };
    }, [invoices, payments]);
    
    const statusConfig = {
        'Paid': { color: '#22c55e' },
        'Sent': { color: '#3b82f6' },
        'Draft': { color: '#f97316' },
        'Overdue': { color: '#ef4444' },
        'Canceled': { color: '#6b7280' },
    };

    const chartData = Object.entries(summary.statusCounts).map(([status, count]) => ({
        status,
        count,
        color: statusConfig[status as Invoice['status']]?.color || '#a8a29e',
    }));
    
    if (invoices.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center text-gray-500">
                <p>No invoices created for this operation yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Invoice Summary</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                    <DonutChart data={chartData} total={invoices.length} />
                </div>
                <div className="w-full flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {summary.financialData.map(data => (
                            <div key={data.currency} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                <p className="text-sm font-bold text-gray-600">{data.currency} Summary</p>
                                <div>
                                    <p className="text-xs text-gray-500">Invoiced</p>
                                    <p className="text-lg font-bold text-gray-800">{formatCurrency(data.totalInvoiced, data.currency)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-green-800">Paid</p>
                                    <p className="text-lg font-bold text-green-700">{formatCurrency(data.totalPaid, data.currency)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-red-800">Balance</p>
                                    <p className="text-lg font-bold text-red-700">{formatCurrency(data.balance, data.currency)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {chartData.map(item => (
                         <div key={item.status} className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                             <div>
                                 <p className="text-sm font-semibold text-gray-800">{item.count}</p>
                                 <p className="text-xs text-gray-500">{item.status}</p>
                            </div>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

type EnrichedInvoice = Invoice & { balance: number; status: 'Paid' | 'Overdue' | 'Sent' | 'Draft' | 'Canceled' };

const InvoicesManager: React.FC<InvoicesManagerProps> = (props) => {
    const { invoices, initialEditInvoiceId, initialViewInvoiceId, onInitialIntentConsumed } = props;
    const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        if (initialEditInvoiceId) {
            const invoiceToEdit = invoices.find(inv => inv.id === initialEditInvoiceId);
            if (invoiceToEdit) {
                setSelectedInvoice(invoiceToEdit);
                setView('form');
            }
            onInitialIntentConsumed();
        } else if (initialViewInvoiceId) {
            const invoiceToView = invoices.find(inv => inv.id === initialViewInvoiceId);
            if (invoiceToView) {
                setSelectedInvoice(invoiceToView);
                setView('detail');
            }
            onInitialIntentConsumed();
        }
    }, [initialEditInvoiceId, initialViewInvoiceId, invoices, onInitialIntentConsumed]);


    const handleCreateNew = () => {
        setSelectedInvoice(null);
        setView('form');
    };

    const handleEdit = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setView('form');
    };
    
    const handleViewDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setView('detail');
    };

    const handleDelete = (invoiceId: string) => {
        if (window.confirm('Are you sure you want to delete this invoice? This action is permanent.')) {
            props.onDeleteInvoice(invoiceId);
            setView('list');
            setSelectedInvoice(null);
        }
    };
    
    const handleSave = (invoiceData: Omit<Invoice, 'id'>) => {
        if (selectedInvoice) {
            props.onUpdateInvoice({ ...invoiceData, id: selectedInvoice.id });
        } else {
            props.onAddInvoice(invoiceData);
        }
        setView('list');
        setSelectedInvoice(null);
    };

    const enrichedInvoices = useMemo((): EnrichedInvoice[] => {
        return props.invoices.map(inv => {
            const relatedPayments = props.payments.filter(p => p.invoiceId === inv.id);
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
    }, [props.invoices, props.payments]);
    
    const getStatusClasses = (status: EnrichedInvoice['status']) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Sent': return 'bg-blue-100 text-blue-800';
            case 'Overdue': return 'bg-red-100 text-red-800';
            case 'Canceled': return 'bg-gray-100 text-gray-600';
            case 'Draft': default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    if (view === 'form') {
        return <InvoiceForm {...props} onCancel={() => setView('list')} invoiceToEdit={selectedInvoice} onAddInvoice={handleSave} onUpdateInvoice={handleSave} />;
    }
    
    if (view === 'detail' && selectedInvoice) {
        return <InvoicePreview
                    invoice={selectedInvoice}
                    project={props.project}
                    payments={props.payments.filter(p => p.invoiceId === selectedInvoice.id)}
                    onBack={() => setView('list')}
                    onEdit={() => handleEdit(selectedInvoice)}
                    onDelete={() => handleDelete(selectedInvoice.id)}
                />
    }

    return (
        <div className="space-y-6">
            <InvoicesSummary invoices={props.invoices} payments={props.payments} />
            <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-gray-800">Invoices</h3>
                 <button onClick={handleCreateNew} className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-1" />
                    Create Invoice
                </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="text-xs text-left text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Invoice #</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Due Date</th>
                            <th className="px-6 py-3 text-right">Total</th>
                            <th className="px-6 py-3 text-right">Balance</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {enrichedInvoices.map(inv => {
                            const canBeEdited = inv.balance > 0 && inv.status !== 'Canceled';
                            const canBeDeleted = props.payments.filter(p => p.invoiceId === inv.id).length === 0;

                            return (
                                <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="px-6 py-4 font-bold text-blue-600">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-gray-600">{inv.invoiceDate}</td>
                                    <td className="px-6 py-4 text-gray-600">{inv.dueDate}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-800 text-right">{formatCurrency(inv.total, inv.currency)}</td>
                                    <td className="px-6 py-4 font-semibold text-red-600 text-right">{formatCurrency(inv.balance, inv.currency)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClasses(inv.status)}`}>{inv.status}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => handleViewDetails(inv)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-200/60" title="View"><EyeIcon className="w-5 h-5"/></button>
                                            <button onClick={() => canBeEdited ? handleEdit(inv) : alert('Paid or canceled invoices cannot be edited.')} disabled={!canBeEdited} className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-200/60 disabled:text-gray-300 disabled:cursor-not-allowed" title="Edit"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => canBeDeleted ? handleDelete(inv.id) : alert('Cannot delete invoice with payments.')} disabled={!canBeDeleted} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-200/60 disabled:text-gray-300 disabled:cursor-not-allowed" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {props.invoices.length === 0 && (
                    <div className="text-center text-gray-500 py-16">
                        <p>No invoices for this operation yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoicesManager;