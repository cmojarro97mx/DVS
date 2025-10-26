import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Quotation, QuotationItem, View, Client, Currency } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { XIcon } from '../components/icons/XIcon';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { BuildingOfficeIcon } from '../components/icons/BuildingOfficeIcon';
import { Banner } from '../components/Banner';
import { quotationsService } from '../src/services/quotationsService';
import { clientsService } from '../src/services/clientsService';

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

const ExpressClientModal: React.FC<{ 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (data: Omit<Client, 'id'>) => void,
    initialName?: string,
}> = ({ isOpen, onClose, onSave, initialName = '' }) => {
    const [formData, setFormData] = useState({ name: initialName, contactPerson: '', email: '', phone: '', currency: 'USD' as Currency });

    useEffect(() => {
        setFormData(prev => ({ ...prev, name: initialName }));
    }, [initialName]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, address: '', status: 'Active' });
    };

    if (!isOpen) return null;

    const inputClasses = "block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">Create New Client</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5 text-gray-600"/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div><label className={labelClasses}>Client Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} required /></div>
                        <div><label className={labelClasses}>Primary Contact Person *</label><input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className={inputClasses} required /></div>
                        <div><label className={labelClasses}>Primary Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} required /></div>
                        <div><label className={labelClasses}>Primary Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} /></div>
                        <div>
                            <label className={labelClasses}>Preferred Currency *</label>
                            <select name="currency" value={formData.currency} onChange={handleChange} className={inputClasses} required>
                                <option value="USD">USD - US Dollar</option>
                                <option value="MXN">MXN - Mexican Peso</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Create and Use Client</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const QuotationForm: React.FC<QuotationFormProps> = ({ onSave, onCancel, quotationToEdit }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(true);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const clientDropdownRef = useRef<HTMLDivElement>(null);
    
    const [formData, setFormData] = useState({
        quotationNumber: `QT-${Math.floor(Math.random() * 9000) + 1000}`,
        clientId: '',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft' as Quotation['status'],
        currency: 'USD',
        notes: '',
        tax: 16,
    });
    const [items, setItems] = useState<Omit<QuotationItem, 'id' | 'total'>[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
                setIsClientDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadClients = async () => {
        try {
            setIsLoadingClients(true);
            const data = await clientsService.getAll();
            setClients(data);
        } catch (err) {
            console.error('Failed to load clients:', err);
        } finally {
            setIsLoadingClients(false);
        }
    };

    const filteredClients = useMemo(() => {
        if (!clientSearch) return clients;
        return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
    }, [clients, clientSearch]);

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setFormData(prev => ({ ...prev, clientId: client.id, currency: client.currency || 'USD' }));
        setClientSearch(client.name);
        setIsClientDropdownOpen(false);
    };

    const handleSaveNewClient = async (clientData: Omit<Client, 'id'>) => {
        try {
            const newClient = await clientsService.create({
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                contactPerson: clientData.contactPerson || '',
                address: clientData.address,
                status: clientData.status,
            });
            const fullClient: Client = {
                ...newClient,
                contactPerson: newClient.contactPerson || '',
                phone: newClient.phone || '',
                address: newClient.address || '',
            };
            handleSelectClient(fullClient);
            setIsClientModalOpen(false);
            await loadClients();
        } catch (err) {
            console.error('Failed to create client:', err);
        }
    };

    useEffect(() => {
        if (quotationToEdit) {
            const quotationItems = Array.isArray(quotationToEdit.items) ? quotationToEdit.items : [];
            setFormData({
                quotationNumber: quotationToEdit.quotationNumber,
                clientId: quotationToEdit.clientId || '',
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
            
            if (quotationToEdit.clientName) {
                setClientSearch(quotationToEdit.clientName);
            }
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
            clientName: clientSearch || 'Unknown Client',
            clientId: formData.clientId,
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

    const inputClasses = "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
    const labelClasses = "block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide";

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in max-w-6xl mx-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{quotationToEdit ? 'Edit Quotation' : 'Create Quotation'}</h2>
                        <p className="text-sm text-gray-600 mt-1">Fill in the details below to generate a professional quote</p>
                    </div>
                    <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" /> Back
                    </button>
                </div>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                        QUOTATION DETAILS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className={labelClasses}>Quote Number</label>
                            <input 
                                type="text" 
                                value={formData.quotationNumber} 
                                onChange={e => setFormData(f => ({...f, quotationNumber: e.target.value}))} 
                                className={inputClasses}
                                placeholder="QT-0001" 
                            />
                        </div>
                        <div className="md:col-span-2 relative" ref={clientDropdownRef}>
                            <label className={labelClasses}>Client *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={clientSearch}
                                    onChange={e => {
                                        setClientSearch(e.target.value);
                                        setIsClientDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsClientDropdownOpen(true)}
                                    placeholder="Search or select a client..."
                                    className={inputClasses + " pr-10"}
                                    required
                                />
                                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                            {isClientDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {isLoadingClients ? (
                                        <div className="p-3 text-sm text-gray-500 text-center">Loading clients...</div>
                                    ) : filteredClients.length > 0 ? (
                                        <>
                                            {filteredClients.map(client => (
                                                <button
                                                    key={client.id}
                                                    type="button"
                                                    onClick={() => handleSelectClient(client)}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0 transition-colors"
                                                >
                                                    <div className="font-medium text-gray-900">{client.name}</div>
                                                    <div className="text-xs text-gray-500">{client.email}</div>
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsClientModalOpen(true);
                                                    setIsClientDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-sm font-medium text-blue-700 flex items-center gap-2 transition-colors"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Create New Client
                                            </button>
                                        </>
                                    ) : (
                                        <div className="p-3">
                                            <p className="text-sm text-gray-500 mb-2">No clients found</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsClientModalOpen(true);
                                                    setIsClientDropdownOpen(false);
                                                }}
                                                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Create New Client
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={labelClasses}>Status</label>
                            <select 
                                value={formData.status} 
                                onChange={e => setFormData(f => ({...f, status: e.target.value as Quotation['status']}))} 
                                className={inputClasses}
                            >
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Date</label>
                            <input 
                                type="date" 
                                value={formData.date} 
                                onChange={e => setFormData(f => ({...f, date: e.target.value}))} 
                                className={inputClasses} 
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Valid Until</label>
                            <input 
                                type="date" 
                                value={formData.validUntil} 
                                onChange={e => setFormData(f => ({...f, validUntil: e.target.value}))} 
                                className={inputClasses} 
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Currency</label>
                            <select 
                                value={formData.currency} 
                                onChange={e => setFormData(f => ({...f, currency: e.target.value}))} 
                                className={inputClasses}
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="MXN">MXN - Mexican Peso</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Tax Rate (%)</label>
                            <input 
                                type="number" 
                                value={formData.tax} 
                                onChange={e => setFormData(f => ({...f, tax: parseFloat(e.target.value) || 0}))} 
                                className={inputClasses}
                                placeholder="16"
                                min="0"
                                max="100"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-5 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Line Items</h3>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-12 gap-3 mb-3 px-2">
                            <div className="col-span-6 text-xs font-semibold text-gray-500 uppercase">Description</div>
                            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase text-right">Quantity</div>
                            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase text-right">Unit Price</div>
                            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase text-right">Total</div>
                        </div>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 items-center p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                                    <div className="col-span-6">
                                        <input 
                                            type="text" 
                                            placeholder="Service or product description" 
                                            value={item.description} 
                                            onChange={e => handleItemChange(index, 'description', e.target.value)} 
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            required 
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input 
                                            type="number" 
                                            placeholder="Qty" 
                                            value={item.quantity} 
                                            onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} 
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input 
                                            type="number" 
                                            placeholder="Price" 
                                            value={item.unitPrice} 
                                            onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} 
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="col-span-1 flex items-center justify-end gap-2">
                                        <span className="font-semibold text-sm text-gray-900">{formatCurrency(item.quantity * item.unitPrice, formData.currency)}</span>
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button 
                                            type="button" 
                                            onClick={() => removeItem(index)} 
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            disabled={items.length === 1}
                                        >
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            type="button" 
                            onClick={addItem} 
                            className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <PlusIcon className="w-4 h-4"/> Add Line Item
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClasses}>Notes / Terms & Conditions</label>
                        <textarea 
                            value={formData.notes} 
                            placeholder="Payment terms, delivery conditions, etc." 
                            onChange={e => setFormData(f => ({...f, notes: e.target.value}))} 
                            className={inputClasses}
                            rows={6}
                        ></textarea>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Summary</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-sm text-gray-600">Subtotal</span>
                                <span className="text-lg font-semibold text-gray-900">{formatCurrency(totals.subtotal, formData.currency)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-sm text-gray-600">Tax ({formData.tax}%)</span>
                                <span className="text-lg font-semibold text-gray-900">{formatCurrency(totals.taxAmount, formData.currency)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 bg-blue-600 text-white rounded-lg px-4 mt-3">
                                <span className="text-sm font-bold uppercase">Total</span>
                                <span className="text-2xl font-bold">{formatCurrency(totals.total, formData.currency)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm hover:shadow transition-all"
                >
                    {quotationToEdit ? 'Save Changes' : 'Create Quotation'}
                </button>
            </div>

            <ExpressClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSave={handleSaveNewClient}
                initialName={clientSearch}
            />
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
                        <h1 className="text-xl font-bold text-slate-800 mt-2">Nexxio</h1>
                        <p className="text-xs text-gray-500">Supply Chain Management</p>
                        <p className="text-xs text-gray-500">contact@nexxio.com</p>
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
                        <div className="flex justify-between"><span className="text-gray-600">Tax:</span><span className="font-medium text-gray-800">{formatCurrency(quotation.tax, quotation.currency)}</span></div>
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
                    <div className="text-center py-16">
                        <div className="bg-gray-200 rounded-full p-5 inline-block mb-4">
                            <ChartBarIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No quotations yet</h3>
                        <p className="text-sm text-gray-500 mb-6">Get started by creating your first quotation</p>
                        <button onClick={handleAddNew} className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Create Quotation
                        </button>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!quotationToDelete}
                onClose={() => setQuotationToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Quotation"
                message={`Are you sure you want to delete quotation "${quotationToDelete?.quotationNumber}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default QuotationsPage;
