import React, { useState, useEffect, useMemo } from 'react';
import { Payment, Invoice, BankAccount, Currency } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { XIcon } from '../components/icons/XIcon';
import { ChartPieIcon } from '../components/icons/ChartPieIcon';

// Panel for adding/editing a payment, inlined as per no-new-files rule.
const PaymentPanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (payment: Omit<Payment, 'id'>) => void;
    paymentToEdit: Payment | null;
    invoices: Invoice[];
    operationId: string;
    bankAccounts: BankAccount[];
}> = ({ isOpen, onClose, onSave, paymentToEdit, invoices, operationId, bankAccounts }) => {
    const initialState = {
        operationId,
        invoiceId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        amount: 0,
        currency: 'USD' as Currency,
        paymentMethod: 'Bank Transfer',
        notes: '',
        bankAccountId: '',
    };
    const [formData, setFormData] = useState(initialState);
    
    useEffect(() => {
        if (isOpen) {
            if (paymentToEdit) {
                setFormData({
                    operationId: paymentToEdit.operationId,
                    invoiceId: paymentToEdit.invoiceId,
                    paymentDate: paymentToEdit.paymentDate,
                    amount: paymentToEdit.amount,
                    currency: paymentToEdit.currency,
                    paymentMethod: paymentToEdit.paymentMethod,
                    notes: paymentToEdit.notes || '',
                    bankAccountId: paymentToEdit.bankAccountId || '',
                });
            } else {
                setFormData(initialState);
            }
        }
    }, [paymentToEdit, isOpen, operationId]);
    
    useEffect(() => {
        if (formData.invoiceId) {
            const selectedInvoice = invoices.find(inv => inv.id === formData.invoiceId);
            if (selectedInvoice) {
                setFormData(prev => ({ ...prev, currency: selectedInvoice.currency }));
            }
        }
    }, [formData.invoiceId, invoices]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const baseInputClasses = "block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    const labelClasses = "text-sm font-medium text-gray-700";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40" onClick={onClose}>
            <div
                className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">{paymentToEdit ? 'Edit Payment' : 'Add New Payment'}</h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XIcon className="w-6 h-6 text-gray-600" /></button>
                    </div>
                    <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                        <div><label className={labelClasses}>Invoice</label><select name="invoiceId" value={formData.invoiceId} onChange={handleChange} className={baseInputClasses} required><option value="" disabled>Select invoice</option>{invoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} - {i.client}</option>)}</select></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Amount</label>
                                <div className="relative mt-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className={baseInputClasses + " pl-7 pr-12 [color-scheme:light]"} required />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-gray-500 sm:text-sm">{formData.currency}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Payment Date</label>
                                <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} className={baseInputClasses} required />
                            </div>
                        </div>
                        <div><label className={labelClasses}>Payment Method</label><select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className={baseInputClasses} required><option>Bank Transfer</option><option>Credit Card</option><option>PayPal</option><option>Cash</option><option>Other</option></select></div>
                        <div><label className={labelClasses}>Deposit to Account</label><select name="bankAccountId" value={formData.bankAccountId} onChange={handleChange} className={baseInputClasses}><option value="">None</option>{bankAccounts.map(ba => <option key={ba.id} value={ba.id}>{ba.accountName} ({ba.currency})</option>)}</select></div>
                        <div><label className={labelClasses}>Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} className={baseInputClasses} rows={3}></textarea></div>
                    </div>
                    <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Payment</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface PaymentsManagerProps {
  operationId: string;
  payments: Payment[];
  invoices: Invoice[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onUpdatePayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
  bankAccounts: BankAccount[];
}

const formatCurrency = (amount: number, currency: string) => 
    `${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;

const PaymentsSummaryChart: React.FC<{ invoices: Invoice[]; payments: Payment[] }> = ({ invoices, payments }) => {
    const summaryByCurrency = useMemo(() => {
        const data: Record<string, { totalInvoiced: number; totalPaid: number }> = {};
        
        invoices.forEach(inv => {
            if (!data[inv.currency]) data[inv.currency] = { totalInvoiced: 0, totalPaid: 0 };
            data[inv.currency].totalInvoiced += inv.total;
        });

        payments.forEach(p => {
            if (!data[p.currency]) data[p.currency] = { totalInvoiced: 0, totalPaid: 0 };
            data[p.currency].totalPaid += p.amount;
        });

        return Object.entries(data).map(([currency, values]) => ({
            currency,
            ...values,
            percentage: values.totalInvoiced > 0 ? (values.totalPaid / values.totalInvoiced) * 100 : 0
        }));
    }, [invoices, payments]);
    
    if (invoices.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center text-gray-500">
                <p>No invoices created for this operation yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Status by Currency</h3>
            {summaryByCurrency.length > 0 ? (
                <div className="space-y-6">
                    {summaryByCurrency.map(({ currency, totalInvoiced, totalPaid, percentage }) => (
                        <div key={currency}>
                            <h4 className="text-sm font-bold text-gray-700 mb-2">{currency}</h4>
                            <div className="flex flex-col sm:flex-row gap-6 items-center">
                                 <div className="w-full sm:w-1/2 space-y-2">
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Total Paid</span>
                                        <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid, currency)}</p>
                                    </div>
                                     <div>
                                        <span className="text-sm font-medium text-gray-500">Total Invoiced</span>
                                        <p className="text-xl font-bold text-gray-800">{formatCurrency(totalInvoiced, currency)}</p>
                                    </div>
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-sm font-semibold text-blue-800">Paid Progress</span>
                                        <span className="text-lg font-bold text-blue-600">{percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <div 
                                            className="bg-blue-500 h-4 rounded-full transition-all duration-1000 ease-out" 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500">
                    <p>No invoices or payments to display.</p>
                </div>
            )}
        </div>
    );
};


const PaymentsManager: React.FC<PaymentsManagerProps> = (props) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null);

    const handleEdit = (payment: Payment) => {
        setEditingPayment(payment);
        setIsPanelOpen(true);
    };

    const handleDeleteClick = (paymentId: string) => {
        setPaymentToDeleteId(paymentId);
    };

    const confirmDelete = () => {
        if (paymentToDeleteId) {
            props.onDeletePayment(paymentToDeleteId);
        }
        setPaymentToDeleteId(null);
    };

    const cancelDelete = () => {
        setPaymentToDeleteId(null);
    };

    const handleSave = (paymentData: Omit<Payment, 'id'>) => {
        if (editingPayment) {
            props.onUpdatePayment({ ...paymentData, id: editingPayment.id });
        } else {
            props.onAddPayment(paymentData);
        }
        setIsPanelOpen(false);
        setEditingPayment(null);
    };

    const handleCancel = () => {
        setIsPanelOpen(false);
        setEditingPayment(null);
    };
    
    const handleAddNew = () => {
        setEditingPayment(null);
        setIsPanelOpen(true);
    };

    const getInvoiceInfo = (invoiceId: string) => {
        const invoice = props.invoices.find(inv => inv.id === invoiceId);
        return {
            number: invoice?.invoiceNumber || 'N/A',
            currency: invoice?.currency || 'USD'
        };
    };

    return (
        <div className="space-y-6">
            <PaymentsSummaryChart invoices={props.invoices} payments={props.payments} />
            <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-gray-800">Payments Recorded</h3>
                 <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Payment
                </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Invoice #</th>
                            <th scope="col" className="px-6 py-3">Payment Date</th>
                            <th scope="col" className="px-6 py-3">Amount</th>
                            <th scope="col" className="px-6 py-3">Method</th>
                            <th scope="col" className="px-6 py-3">Deposited To</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.payments.map(p => {
                             const invoiceInfo = getInvoiceInfo(p.invoiceId);
                             const bankAccount = props.bankAccounts.find(acc => acc.id === p.bankAccountId);
                             return (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{invoiceInfo.number}</td>
                                    <td className="px-6 py-4">{p.paymentDate}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-800">{formatCurrency(p.amount, p.currency)}</td>
                                    <td className="px-6 py-4">{p.paymentMethod}</td>
                                    <td className="px-6 py-4">
                                        {bankAccount ? (
                                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{bankAccount.accountName}</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEdit(p)} className="p-1 text-gray-400 hover:text-blue-600"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteClick(p.id)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                             );
                        })}
                    </tbody>
                </table>
                 {props.payments.length === 0 && (
                    <div className="text-center text-gray-500 py-16">
                        <p className="font-medium">No payments recorded yet.</p>
                        <p className="text-sm">Click "Add Payment" to get started.</p>
                    </div>
                )}
            </div>

            <PaymentPanel
                isOpen={isPanelOpen}
                onClose={handleCancel}
                onSave={handleSave}
                paymentToEdit={editingPayment}
                invoices={props.invoices}
                operationId={props.operationId}
                bankAccounts={props.bankAccounts}
            />

            <ConfirmationModal
                isOpen={!!paymentToDeleteId}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title="Delete Payment"
            >
                Are you sure you want to delete this payment record? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
};

export default PaymentsManager;