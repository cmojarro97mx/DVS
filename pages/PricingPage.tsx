import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Quotation, Lead, Client, QuotationItem, Currency } from './DashboardPage';
import { CalculatorIcon } from '../components/icons/CalculatorIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { Banner } from '../components/Banner';
import { XIcon } from '../components/icons/XIcon';


// --- New Client Modal Component ---
interface NewClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (clientData: Omit<Client, 'id' | 'address' | 'status' | 'tier' | 'contacts'>) => void;
}

const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', contactPerson: '', email: '', phone: '', currency: 'USD' as Currency });

    useEffect(() => {
        if (isOpen) {
            setFormData({ name: '', contactPerson: '', email: '', phone: '', currency: 'USD' });
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
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


// --- Main Pricing Page Component ---
interface PricingPageProps {
    onGenerateQuotation: (quotationData: Omit<Quotation, 'id'>) => void;
    clients: Client[];
    onAddClient: (clientData: Omit<Client, 'id'>) => Client;
}

const PricingPage: React.FC<PricingPageProps> = ({ onGenerateQuotation, clients, onAddClient }) => {
    const [items, setItems] = useState<Omit<QuotationItem, 'id' | 'total'>[]>([{ description: 'Freight Cost', quantity: 1, unitPrice: 0 }]);
    const [customer, setCustomer] = useState('');
    const [taxRate, setTaxRate] = useState(16);
    const [margin, setMargin] = useState(15);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [customerOptions, setCustomerOptions] = useState<{ clients: Client[] }>({ clients });
    const [showNoResults, setShowNoResults] = useState(false);
    const [currency, setCurrency] = useState<Currency>('USD');
    const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
    const [validUntil, setValidUntil] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [terms, setTerms] = useState(
        `- Offer Validity: This quotation is valid for 15 days. Rates may vary after this period and are subject to space and equipment availability.\n- Payment Terms: Payment will be made according to the agreed credit terms. Late fees will apply to overdue invoices.\n- Scope of Service: The rate exclusively covers the services described herein. Additional costs such as delays, storage, inspections, or taxes are not included and will be billed separately.\n- Liability Limit: Our liability is limited according to international conventions and the carrier's terms. We strongly recommend purchasing cargo insurance for full protection.\n- Acceptance: Confirmation of this quotation implies acceptance of all terms and conditions set forth herein.`
    );

    useEffect(() => {
        const selectedClient = clients.find(c => c.name === customer);
        if (selectedClient && selectedClient.currency) {
            setCurrency(selectedClient.currency);
        }
    }, [customer, clients]);
    
    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomer(value);

        if (value) {
            const filteredClients = clients.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
            setCustomerOptions({ clients: filteredClients });
            setShowNoResults(filteredClients.length === 0);
        } else {
            setCustomerOptions({ clients });
            setShowNoResults(false);
        }
    };
    
    const handleItemChange = (index: number, field: keyof Omit<QuotationItem, 'id' | 'total'>, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value < 0 ? 0 : value;
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const { subtotal, marginAmount, subtotalWithMargin, taxAmount, total } = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const marginAmount = subtotal * (margin / 100);
        const subtotalWithMargin = subtotal + marginAmount;
        const taxAmount = subtotalWithMargin * (taxRate / 100);
        const total = subtotalWithMargin + taxAmount;
        return { subtotal, marginAmount, subtotalWithMargin, taxAmount, total };
    }, [items, taxRate, margin]);
    
    const handleSaveNewClient = (clientData: Omit<Client, 'id' | 'address' | 'status' | 'tier' | 'contacts'>) => {
        const newClient = onAddClient({ ...clientData, address: '', status: 'Active' });
        setCustomer(newClient.name);
        if (newClient.currency) setCurrency(newClient.currency);
        setIsClientModalOpen(false);
        setShowNoResults(false);
    };

    const handleSubmit = () => {
        if (!customer) { alert('Please select or create a client.'); return; }

        const finalItems: QuotationItem[] = items.map((item, i) => ({ ...item, id: `item-${Date.now()}-${i}`, total: item.quantity * item.unitPrice }));

        const quotationData: Omit<Quotation, 'id'> = {
            quotationNumber: `QT-${Math.floor(Math.random() * 90000) + 10000}`,
            clientName: customer,
            date: quotationDate, validUntil: validUntil, status: 'Draft',
            currency: currency, items: finalItems,
            subtotal: subtotalWithMargin, tax: taxAmount, total: total, notes: terms,
        };
        onGenerateQuotation(quotationData);
    };

    const formatCurrencyDisplay = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    const inputClasses = "block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
    
    return (
      <>
        <div className="animate-fade-in space-y-6">
            <Banner title="Pricing & Rate Calculator" description="Manually build and calculate precise quotes for your clients." icon={CalculatorIcon} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
                         <h3 className="text-lg font-bold text-gray-800">Quotation Details</h3>
                         <div><label className={labelClasses}>Client</label><div className="flex items-center gap-2"><input list="customers" placeholder="Select or type a customer" value={customer} onChange={handleCustomerChange} className={inputClasses + " flex-grow"} required /><datalist id="customers">{customerOptions.clients.length > 0 && <optgroup label="Clients">{customerOptions.clients.map(c => <option key={`client-${c.id}`} value={c.name} />)}</optgroup>}</datalist><button type="button" onClick={() => setIsClientModalOpen(true)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-all duration-300 ${showNoResults ? 'animate-pulse-glow' : ''}`}><PlusIcon className="w-4 h-4" />New</button></div>{showNoResults && (<div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800 flex items-center justify-between"><span>No matches found. Need to add a new client?</span><svg className="w-6 h-6 animate-point-right" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>)}</div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className={labelClasses}>Currency</label><select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className={inputClasses}><option value="USD">USD</option><option value="MXN">MXN</option><option value="EUR">EUR</option></select></div>
                            <div><label className={labelClasses}>Quotation Date</label><input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Valid Until</label><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputClasses} /></div>
                         </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-3">
                        <h3 className="text-lg font-bold text-gray-800">Cost Components</h3>
                        {items.map((item, index) => (<div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50/70"><input type="text" placeholder="Item description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className={inputClasses + " flex-grow"} /><input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} className={inputClasses + " w-20 text-right [color-scheme:light]"} /><input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} className={inputClasses + " w-28 text-right [color-scheme:light]"} /><button type="button" onClick={() => removeItem(index)} className="p-1 text-gray-400 hover:text-red-600 rounded-full"><TrashIcon className="w-4 h-4"/></button></div>))}
                        <button onClick={addItem} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Cost Item</button>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <label className={labelClasses}>Terms & Conditions</label>
                        <textarea value={terms} onChange={e => setTerms(e.target.value)} className={inputClasses + " h-32"} rows={6}></textarea>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 sticky top-24">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Summary & Pricing</h3>
                      <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center"><span className="text-gray-600">Subtotal (Cost)</span><span className="font-semibold text-gray-800">{formatCurrencyDisplay(subtotal)}</span></div>
                          <div className="flex justify-between items-center"><span className="text-gray-600">Margin</span><div className="flex items-center gap-1"><input type="number" value={margin} onChange={e => setMargin(parseFloat(e.target.value) || 0)} className="w-20 text-right border-gray-300 rounded-md shadow-sm text-sm p-1.5 text-gray-900 bg-gray-50 [color-scheme:light]" /><span className="font-medium text-gray-500">%</span></div></div>
                          <div className="flex justify-between items-center"><span className="text-gray-600">Margin Amount</span><span className="font-semibold text-gray-800">{formatCurrencyDisplay(marginAmount)}</span></div>
                          <hr className="my-2" />
                          <div className="flex justify-between items-center font-semibold"><span className="text-gray-700">Subtotal + Margin</span><span className="text-gray-900">{formatCurrencyDisplay(subtotalWithMargin)}</span></div>
                          <div className="flex justify-between items-center"><span className="text-gray-600">Tax</span><div className="flex items-center gap-1"><input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-20 text-right border-gray-300 rounded-md shadow-sm text-sm p-1.5 text-gray-900 bg-gray-50 [color-scheme:light]" /><span className="font-medium text-gray-500">%</span></div></div>
                          <div className="flex justify-between items-center"><span className="text-gray-600">Tax Amount</span><span className="font-semibold text-gray-800">{formatCurrencyDisplay(taxAmount)}</span></div>
                      </div>
                      <div className="mt-4 pt-4 border-t-2 border-dashed">
                        <div className="flex justify-between items-center p-3 bg-slate-800 text-white rounded-lg">
                            <span className="font-bold text-lg">TOTAL</span>
                            <span className="font-bold text-2xl">{formatCurrencyDisplay(total)}</span>
                        </div>
                      </div>
                      <div className="mt-6">
                        <button onClick={handleSubmit} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Generate Quotation</button>
                      </div>
                    </div>
                </div>
            </div>
        </div>
        <NewClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onSave={handleSaveNewClient} />
        <style>{`@keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); transform: scale(1); } 50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); transform: scale(1.05); } } .animate-pulse-glow { animation: pulse-glow 2s infinite; } @keyframes point-right { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(5px); } } .animate-point-right { animation: point-right 1s infinite ease-in-out; }`}</style>
      </>
    );
};

export default PricingPage;