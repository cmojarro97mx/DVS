import React, { useState, useEffect, useRef } from 'react';
import { Expense, TeamMember, UploadedFile, Project, BankAccount, Currency } from '../pages/DashboardPage';
import { XIcon } from './icons/XIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { FileIcon } from './icons/FileIcon';

interface ExpensePanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id'>) => void;
    expenseToEdit: Expense | null;
    teamMembers: TeamMember[];
    operationId?: string;
    projects?: Project[];
    bankAccounts: BankAccount[];
}

const expenseCategories = [
    'Port Charges', 'Customs Fees', 'Transportation', 'Warehousing', 'Documentation', 
    'Office Supplies', 'Rent', 'Utilities', 'Gasoline', 'Food & Dining', 'Travel', 'Events', 'Other'
];
const currencies: Currency[] = ['USD', 'MXN', 'EUR'];

export const ExpensePanel: React.FC<ExpensePanelProps> = ({ isOpen, onClose, onSave, expenseToEdit, teamMembers, operationId, projects, bankAccounts }) => {
    const initialState: Omit<Expense, 'id' | 'bill'> = {
        operationId: operationId || '',
        itemName: '',
        currency: 'USD' as Currency,
        exchangeRate: 1,
        price: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        employee: '',
        expenseCategory: '',
        purchasedFrom: '',
        bankAccount: '',
        description: '',
    };

    const [formData, setFormData] = useState(initialState);
    const [bill, setBill] = useState<UploadedFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (expenseToEdit) {
                setFormData({
                    operationId: expenseToEdit.operationId,
                    itemName: expenseToEdit.itemName,
                    currency: expenseToEdit.currency,
                    exchangeRate: expenseToEdit.exchangeRate,
                    price: expenseToEdit.price,
                    purchaseDate: expenseToEdit.purchaseDate,
                    employee: expenseToEdit.employee,
                    expenseCategory: expenseToEdit.expenseCategory,
                    purchasedFrom: expenseToEdit.purchasedFrom || '',
                    bankAccount: expenseToEdit.bankAccount || '',
                    description: expenseToEdit.description || '',
                });
                setBill(expenseToEdit.bill || null);
            } else {
                setFormData(initialState);
                setBill(null);
            }
        }
    }, [expenseToEdit, isOpen, operationId]);

    useEffect(() => {
        if (formData.bankAccount) {
            const selectedAccount = bankAccounts.find(ba => ba.id === formData.bankAccount);
            if (selectedAccount) {
                setFormData(prev => ({...prev, currency: selectedAccount.currency}));
            }
        }
    }, [formData.bankAccount, bankAccounts]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'exchangeRate' ? parseFloat(value) : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBill({ file, preview: URL.createObjectURL(file) });
        }
    };

    const removeBill = () => {
        if (bill) {
            URL.revokeObjectURL(bill.preview);
        }
        setBill(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, bill: bill || undefined });
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
                        <h2 className="text-xl font-bold text-gray-800">{expenseToEdit ? 'Edit Expense' : 'Add New Expense'}</h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XIcon className="w-6 h-6 text-gray-600" /></button>
                    </div>
                    <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                        {!operationId && projects && (
                             <div>
                                <label className={labelClasses}>Operation (Optional)</label>
                                <select name="operationId" value={formData.operationId} onChange={handleChange} className={baseInputClasses}>
                                    <option value="">No operation (administrative)</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.projectName} ({p.id})</option>)}
                                </select>
                            </div>
                        )}
                        <div><label className={labelClasses}>Item Name</label><input type="text" name="itemName" value={formData.itemName} onChange={handleChange} className={baseInputClasses} required /></div>
                        
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className={labelClasses}>Bank Account</label>
                                <select name="bankAccount" value={formData.bankAccount} onChange={handleChange} className={baseInputClasses} required>
                                    <option value="" disabled>Select account</option>
                                    {bankAccounts.map(ba => <option key={ba.id} value={ba.id}>{ba.accountName} - {ba.bankName}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className={labelClasses}>Purchased From</label>
                                <input type="text" name="purchasedFrom" value={formData.purchasedFrom} onChange={handleChange} className={baseInputClasses} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><label className={labelClasses}>Price</label><input type="number" name="price" value={formData.price} onChange={handleChange} className={baseInputClasses + " [color-scheme:light]"} required step="0.01" /></div>
                            <div>
                                <label className={labelClasses}>Currency</label>
                                <select name="currency" value={formData.currency} onChange={handleChange} className={baseInputClasses} required disabled={!!formData.bankAccount}>
                                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div><label className={labelClasses}>Exchange Rate</label><input type="number" name="exchangeRate" value={formData.exchangeRate} onChange={handleChange} className={baseInputClasses + " [color-scheme:light]"} step="0.01" /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Purchase Date</label><input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className={baseInputClasses} required /></div>
                            <div><label className={labelClasses}>Employee</label><select name="employee" value={formData.employee} onChange={handleChange} className={baseInputClasses} required><option value="" disabled>Select employee</option>{teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select></div>
                        </div>
                        <div><label className={labelClasses}>Expense Category</label><select name="expenseCategory" value={formData.expenseCategory} onChange={handleChange} className={baseInputClasses} required><option value="" disabled>Select category</option>{expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label className={labelClasses}>Description</label><textarea name="description" value={formData.description} onChange={handleChange} className={baseInputClasses} rows={3}></textarea></div>
                        <div>
                            <label className={labelClasses}>Attach Bill</label>
                             <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center"><UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" /><div className="flex text-sm text-gray-600"><label htmlFor="bill-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"><span>Upload a file</span><input id="bill-upload" name="bill-upload" type="file" ref={fileInputRef} className="sr-only" onChange={handleFileChange} /></label></div></div>
                            </div>
                            {bill && (
                                <div className="mt-2 flex items-center justify-between p-2 bg-gray-100 rounded-md border">
                                    <div className="flex items-center gap-2">
                                        <FileIcon className="w-6 h-6 text-gray-500" />
                                        <span className="text-sm text-gray-700 truncate">{bill.file.name}</span>
                                    </div>
                                    <button type="button" onClick={removeBill} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><XIcon className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Expense</button>
                    </div>
                </form>
            </div>
        </div>
    );
};