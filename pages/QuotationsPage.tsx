import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Quotation, QuotationItem, View } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { XIcon } from '../components/icons/XIcon';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { LogoIcon } from '../components/icons/LogoIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { Banner } from '../components/Banner';
import { quotationsService } from '../src/services/quotationsService';

// --- INTERFACES ---
interface QuotationsPageProps {
    setActiveView: (view: View) => void;
}

interface QuotationFormProps {
    onSave: (quotation: Omit<Quotation, 'id'>) => void;
    onCancel: () => void;
    quotationToEdit: Quotation | null;
}

interface QuotationPreviewProps {
    quotation: Quotation;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

// --- SUB-COMPONENTS (within the same file) ---

const QuotationForm: React.FC<QuotationFormProps> = ({ onSave, onCancel, quotationToEdit }) => {
    const [formData, setFormData] = useState({
        quotationNumber: `QT-${Math.floor(Math.random() * 9000) + 1000}`,
        clientName: '',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft' as Quotation['status'],
        currency: 'USD',
        notes: '',
        tax: 16,
    });
    const [items, setItems] = useState<Omit<QuotationItem, 'id' | 'total'>[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

    useEffect(() => {
        if (quotationToEdit) {
            const quotationItems = Array.isArray(quotationToEdit.items) ? quotationToEdit.items : [];
            setFormData({
                quotationNumber: quotationToEdit.quotationNumber,
                clientName: quotationToEdit.clientName || '',
                date: quotationToEdit.quotationDate || quotationToEdit.date || new Date().toISOString().split('T')[0],
                validUntil: quotationToEdit.validUntil || '',
                status: quotationToEdit.status,
                currency: quotationToEdit.currency || 'USD',
                notes: quotationToEdit.notes || '',
                tax: quotationToEdit.tax ? (quotationToEdit.tax / quotationToEdit.subtotal * 100) : 16,
            });
            setItems(quotationItems.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            })));
        }
    }, [quotationToEdit]);

    const calculateTotals = useCallback(() => {
        const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const taxAmount = subtotal * (formData.tax / 100);
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    }, [items, formData.tax]);
    
    const totals = calculateTotals();

    const handleItemChange = (index: number, field: keyof Omit<QuotationItem, 'id' | 'total'>, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index] };
        (item as any)[field] = value < 0 ? 0 : value;
        newItems[index] = item;
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalItems = items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
        }));
        
        const quotationData: any = {
            quotationNumber: formData.quotationNumber,
            quotationDate: formData.date,
            validUntil: formData.validUntil,
            clientName: formData.clientName,
            status: formData.status,
            currency: formData.currency,
            items: finalItems,
            subtotal: totals.subtotal,
            tax: totals.taxAmount,
            total: totals.total,
            notes: formData.notes,
        };
        onSave(quotationData);
    };

    const inputClasses = "w-full bg-gray-50 border-gray-300 rounded-md shadow-sm text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500";

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{quotationToEdit ? 'Edit Quotation' : 'Create Quotation'}</h2>
                <button type="button" onClick={onCancel} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to list
                </button>
            </div>
            
            <div className="p-4 bg-gray-50/70 rounded-lg border border-gray-200/80">
                <h3 className="font-bold text-gray-800 mb-4">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div><label className="text-xs text-gray-600">Quote #</label><input type="text" value={formData.quotationNumber} onChange={e => setFormData(f => ({...f, quotationNumber: e.target.value}))} className={inputClasses} /></div>
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-600">Client</label>
                        <input placeholder="Type a client name" value={formData.clientName} onChange={e => setFormData(f => ({...f, clientName: e.target.value}))} className={inputClasses} required />
                    </div>
                    <div><label className="text-xs text-gray-600">Date</label><input type="date" value={formData.date} onChange={e => setFormData(f => ({...f, date: e.target.value}))} className={inputClasses} /></div>
                    <div><label className="text-xs text-gray-600">Valid Until</label><input type="date" value={formData.validUntil} onChange={e => setFormData(f => ({...f, validUntil: e.target.value}))} className={inputClasses} /></div>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="font-bold text-gray-800">Items</h3>
                <div className="grid grid-cols-12 gap-2 font-semibold text-xs text-gray-500 px-2">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-right">Quantity</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-2 text-right">Total</div>
                </div>
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                        <input type="text" placeholder="Service or product description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className={inputClasses + " flex-grow"} required />
                        <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} className={inputClasses + " w-20 text-right [color-scheme:light]"} />
                        <input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} className={inputClasses + " w-28 text-right [color-scheme:light]"} />
                        <span className="font-semibold text-sm w-24 text-right text-gray-800">{formatCurrency(item.quantity * item.unitPrice, formData.currency)}</span>
                        <button type="button" onClick={() => removeItem(index)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
                <button type="button" onClick={addItem} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 mt-2"><PlusIcon className="w-4 h-4"/> Add Item</button>
            </div>
            
            <div className="flex justify-between items-start gap-8">
                <div className="flex-grow">
                    <label className="text-sm font-medium text-gray-600">Notes / Terms</label>
                    <textarea value={formData.notes} placeholder="e.g. Terms and conditions, payment details, etc." onChange={e => setFormData(f => ({...f, notes: e.target.value}))} className={inputClasses + " mt-1"} rows={4}></textarea>
                </div>
                <div className="w-full max-w-sm space-y-2 pt-4">
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-semibold text-gray-800">{formatCurrency(totals.subtotal, formData.currency)}</span></div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Tax (%)</span>
                        <input type="number" value={formData.tax} onChange={e => setFormData(f => ({...f, tax: parseFloat(e.target.value) || 0}))} className={inputClasses + " w-20 text-right [color-scheme:light]"} />
                    </div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Tax Amount</span><span className="font-semibold text-gray-800">{formatCurrency(totals.taxAmount, formData.currency)}</span></div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Currency</span>
                        <input type="text" value={formData.currency} onChange={e => setFormData(f => ({...f, currency: e.target.value.toUpperCase()}))} className={inputClasses + " w-20 text-right"} placeholder="USD" />
                    </div>
                    <div className="border-t my-2"></div>
                    <div className="flex justify-between font-bold text-lg"><span className="text-gray-800">Total</span><span className="text-gray-800">{formatCurrency(totals.total, formData.currency)}</span></div>
                </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onCancel} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{quotationToEdit ? 'Save Changes' : 'Create Quotation'}</button>
            </div>
        </form>
    );
};

const QuotationPreview: React.FC<QuotationPreviewProps> = ({ quotation, onBack, onEdit, onDelete }) => {
    return (
        <div className="space-y-6 animate-fade-in">
             <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; border: none !important; box-shadow: none !important; }
                    .no-print { display: none; }
                }
            `}</style>
            <div className="flex justify-between items-center no-print">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to list</button>
                <div className="flex items-center gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"><PrinterIcon className="w-4 h-4"/> Print / PDF</button>
                    <button onClick={onEdit} className="p-2 border rounded-lg hover:bg-gray-50"><EditIcon className="w-5 h-5 text-gray-600"/></button>
                    <button onClick={onDelete} className="p-2 border rounded-lg hover:bg-red-50"><TrashIcon className="w-5 h-5 text-red-600"/></button>
                </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-xl border border-gray-200 shadow-sm printable-area">
                <header className="grid grid-cols-2 items-start mb-12">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 mt-2">LogiCRM</h1>
                        <p className="text-xs text-gray-500">123 Logistics Lane, Port City, 10101</p>
                        <p className="text-xs text-gray-500">contact@logicrm.com</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-bold text-gray-800 uppercase tracking-wider">Quotation</h2>
                        <p className="text-sm text-gray-500 mt-1">{quotation.quotationNumber}</p>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-8 mb-12 text-sm">
                    <div>
                        <p className="font-semibold text-gray-500 mb-1">BILLED TO</p>
                        <p className="font-bold text-gray-800 text-base">{quotation.clientName}</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p><span className="font-semibold text-gray-500">Date of Issue:</span> <span className="text-gray-800">{quotation.date}</span></p>
                        <p><span className="font-semibold text-gray-500">Valid Until:</span> <span className="text-gray-800">{quotation.validUntil}</span></p>
                    </div>
                </section>

                <section>
                    <table className="w-full text-sm">
                        <thead className="border-b-2 border-gray-800">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600 uppercase">Description</th>
                                <th className="p-3 w-24 text-right font-semibold text-gray-600 uppercase">Qty</th>
                                <th className="p-3 w-32 text-right font-semibold text-gray-600 uppercase">Unit Price</th>
                                <th className="p-3 w-32 text-right font-semibold text-gray-600 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {quotation.items.map(item => (
                                <tr key={item.id}>
                                    <td className="p-3 font-medium text-gray-800">{item.description}</td>
                                    <td className="p-3 text-right text-gray-600">{item.quantity}</td>
                                    <td className="p-3 text-right text-gray-600">{formatCurrency(item.unitPrice, quotation.currency)}</td>
                                    <td className="p-3 text-right font-semibold text-gray-800">{formatCurrency(item.total, quotation.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                
                <section className="flex justify-end mt-8">
                    <div className="w-full max-w-xs space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="font-medium text-gray-800">{formatCurrency(quotation.subtotal, quotation.currency)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Tax ({quotation.tax}%):</span><span className="font-medium text-gray-800">{formatCurrency(quotation.subtotal * (quotation.tax / 100), quotation.currency)}</span></div>
                        <div className="border-t-2 border-gray-800 my-2 pt-3 flex justify-between font-bold text-lg"><span className="text-gray-800">TOTAL ({quotation.currency})</span><span>{formatCurrency(quotation.total, quotation.currency)}</span></div>
                    </div>
                </section>

                {quotation.notes && (
                     <section className="mt-12 border-t pt-6 text-sm">
                        <h4 className="font-semibold text-gray-600 mb-2 uppercase">Notes</h4>
                        <p className="text-gray-500 whitespace-pre-wrap">{quotation.notes}</p>
                    </section>
                )}

                 <footer className="text-center text-xs text-gray-400 mt-12 pt-6 border-t">
                    <p>Thank you for your business!</p>
                </footer>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const QuotationsPage: React.FC<QuotationsPageProps> = ({ setActiveView }) => {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'form' | 'preview'>('list');
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const quotationsData = await quotationsService.getAll();
            setQuotations(quotationsData as any);
        } catch (error) {
            console.error('Error loading quotations data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredQuotations = useMemo(() => {
        return quotations.filter(q =>
            q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.clientName.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [quotations, searchQuery]);
    
    const handleAddNew = () => {
        setSelectedQuotation(null);
        setView('form');
    };
    
    const handleEdit = (quotation: Quotation) => {
        setSelectedQuotation(quotation);
        setView('form');
    };

    const handleView = (quotation: Quotation) => {
        setSelectedQuotation(quotation);
        setView('preview');
    };

    const handleSave = async (quotationData: Omit<Quotation, 'id'>) => {
        try {
            if (selectedQuotation) {
                await quotationsService.update(selectedQuotation.id, quotationData as any);
            } else {
                await quotationsService.create(quotationData as any);
            }
            await loadData();
            setView('list');
        } catch (error) {
            console.error('Error saving quotation:', error);
        }
    };

    const confirmDelete = async () => {
        if (quotationToDelete) {
            try {
                await quotationsService.delete(quotationToDelete.id);
                await loadData();
                setQuotationToDelete(null);
                if (selectedQuotation?.id === quotationToDelete.id) {
                    setView('list');
                }
            } catch (error) {
                console.error('Error deleting quotation:', error);
            }
        }
    };
    
    const getStatusClasses = (status: Quotation['status']) => {
        switch (status) {
            case 'Accepted': return 'bg-green-100 text-green-800';
            case 'Sent': return 'bg-blue-100 text-blue-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Draft': default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (view === 'form') {
        return <QuotationForm onSave={handleSave} onCancel={() => setView('list')} quotationToEdit={selectedQuotation} />;
    }
    
    if (view === 'preview' && selectedQuotation) {
        return <QuotationPreview quotation={selectedQuotation} onBack={() => setView('list')} onEdit={() => handleEdit(selectedQuotation)} onDelete={() => setQuotationToDelete(selectedQuotation)} />;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <Banner
                title="Quotations"
                description="Create and manage your service quotes."
                icon={ChartBarIcon}
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search quotations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Quotation
                    </button>
                </div>

                 {filteredQuotations.length > 0 ? (
                    <div className="space-y-3">
                        {filteredQuotations.map(quote => (
                            <div key={quote.id} className="bg-white p-4 rounded-xl border border-gray-200 grid grid-cols-6 gap-4 items-center hover:border-blue-500 hover:bg-blue-50/50 transition-colors">
                                <div className="col-span-2">
                                    <p className="font-bold text-blue-600">{quote.quotationNumber}</p>
                                    <p className="text-sm text-gray-800">{quote.clientName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Date</p>
                                    <p className="font-medium text-gray-700">{quote.date}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total</p>
                                    <p className="font-bold text-lg text-gray-900">{formatCurrency(quote.total, quote.currency)}</p>
                                </div>
                                <div className="text-center">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClasses(quote.status)}`}>{quote.status}</span>
                                </div>
                                <div className="flex justify-end items-center gap-2">
                                    <button onClick={() => handleView(quote)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200" title="View Details"><EyeIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleEdit(quote)} className="p-2 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-200" title="Edit"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setQuotationToDelete(quote)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center bg-gray-50/75 border border-gray-200 rounded-xl py-20 flex flex-col items-center justify-center">
                        <div className="bg-gray-200 rounded-full p-5">
                            <ChartBarIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="mt-6 text-lg font-semibold text-gray-800">No Quotations Found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating your first quotation.</p>
                    </div>
                )}
            </div>
             <ConfirmationModal
                isOpen={!!quotationToDelete}
                onClose={() => setQuotationToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Quotation"
            >
                Are you sure you want to delete quote "{quotationToDelete?.quotationNumber}"? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
};

export default QuotationsPage;