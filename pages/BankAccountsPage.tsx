import React, { useState, useMemo } from 'react';
import { BankAccount, Payment, Expense, Currency } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { XIcon } from '../components/icons/XIcon';
import { BuildingLibraryIcon } from '../components/icons/BuildingLibraryIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { Banner } from '../components/Banner';
import { ArrowUpCircleIcon } from '../components/icons/ArrowUpCircleIcon';
import { ArrowDownCircleIcon } from '../components/icons/ArrowDownCircleIcon';

// --- Interfaces ---
interface BankAccountsPageProps {
    accounts: BankAccount[];
    payments: Payment[];
    expenses: Expense[];
    onAddAccount: (account: Omit<BankAccount, 'id'>) => void;
    onUpdateAccount: (account: BankAccount) => void;
    onDeleteAccount: (accountId: string) => void;
}

// --- Account Modal ---
const AccountModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: Omit<BankAccount, 'id'>) => void;
    accountToEdit: BankAccount | null;
}> = ({ isOpen, onClose, onSave, accountToEdit }) => {
    const initialState = { accountName: '', bankName: '', accountNumber: '', currency: 'USD' as Currency };
    const [formData, setFormData] = useState(initialState);

    React.useEffect(() => {
        if (isOpen) {
            setFormData(accountToEdit ? accountToEdit : initialState);
        }
    }, [accountToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const baseInputClasses = "block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClasses = "text-sm font-medium text-gray-700";
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">{accountToEdit ? 'Edit' : 'Add'} Bank Account</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5 text-gray-600"/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Account Name</label><input type="text" name="accountName" value={formData.accountName} onChange={handleChange} className={baseInputClasses} required /></div>
                            <div><label className={labelClasses}>Bank Name</label><input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className={baseInputClasses} required /></div>
                        </div>
                        <div><label className={labelClasses}>Account Number</label><input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className={baseInputClasses} required /></div>
                        <div>
                            <label className={labelClasses}>Currency</label>
                            <select name="currency" value={formData.currency} onChange={handleChange} className={baseInputClasses} required>
                                <option value="USD">USD - US Dollar</option>
                                <option value="MXN">MXN - Mexican Peso</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Account</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

// --- New Chart Component ---
const MonthlyComparisonChart: React.FC<{
    data: {
        currentMonthIncome: number;
        prevMonthIncome: number;
        currentMonthExpenses: number;
        prevMonthExpenses: number;
    };
    currency: Currency;
}> = ({ data, currency }) => {
    const { currentMonthIncome, prevMonthIncome, currentMonthExpenses, prevMonthExpenses } = data;

    const maxValue = useMemo(() => {
        const max = Math.max(currentMonthIncome, prevMonthIncome, currentMonthExpenses, prevMonthExpenses);
        return max > 0 ? Math.ceil(max / 1000) * 1000 : 1000;
    }, [data]);

    const getBarHeight = (value: number) => (value / maxValue) * 100;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Monthly Activity Comparison</h3>
            <div className="h-64 flex justify-around items-end gap-4 text-center">
                {/* Income Group */}
                <div className="w-1/3 flex flex-col items-center h-full">
                    <div className="flex-grow flex items-end justify-center gap-3 w-full">
                        <div className="w-1/2 group relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {formatCurrency(prevMonthIncome, currency)}
                            </div>
                            <div className="bg-blue-200 rounded-t-md transition-all duration-300 hover:bg-blue-300" style={{ height: `${getBarHeight(prevMonthIncome)}%` }}></div>
                        </div>
                        <div className="w-1/2 group relative">
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {formatCurrency(currentMonthIncome, currency)}
                            </div>
                            <div className="bg-blue-500 rounded-t-md transition-all duration-300 hover:bg-blue-600" style={{ height: `${getBarHeight(currentMonthIncome)}%` }}></div>
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mt-2">Income</p>
                </div>

                {/* Expenses Group */}
                <div className="w-1/3 flex flex-col items-center h-full">
                     <div className="flex-grow flex items-end justify-center gap-3 w-full">
                        <div className="w-1/2 group relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {formatCurrency(prevMonthExpenses, currency)}
                            </div>
                            <div className="bg-red-200 rounded-t-md transition-all duration-300 hover:bg-red-300" style={{ height: `${getBarHeight(prevMonthExpenses)}%` }}></div>
                        </div>
                        <div className="w-1/2 group relative">
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {formatCurrency(currentMonthExpenses, currency)}
                            </div>
                            <div className="bg-red-500 rounded-t-md transition-all duration-300 hover:bg-red-600" style={{ height: `${getBarHeight(currentMonthExpenses)}%` }}></div>
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mt-2">Expenses</p>
                </div>
            </div>
            <div className="flex justify-center items-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-200"></div> Previous Month</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500"></div> Current Month</div>
            </div>
        </div>
    );
};


// --- Main Component ---
const BankAccountsPage: React.FC<BankAccountsPageProps> = ({ accounts, payments, expenses, onAddAccount, onUpdateAccount, onDeleteAccount }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<BankAccount | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

    const accountBalances = useMemo(() => {
        const balances = new Map<string, number>();
        accounts.forEach(acc => {
            const income = payments.filter(p => p.bankAccountId === acc.id).reduce((sum, p) => sum + p.amount, 0);
            const outcome = expenses.filter(e => e.bankAccount === acc.id).reduce((sum, e) => sum + e.price, 0);
            balances.set(acc.id, income - outcome);
        });
        return balances;
    }, [accounts, payments, expenses]);

    const monthlyData = useMemo(() => {
        if (!selectedAccount) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const prevMonth = prevMonthDate.getMonth();
        const prevMonthYear = prevMonthDate.getFullYear();

        const filterAndSum = (items: (Payment[] | Expense[]), dateField: string, amountField: string, month: number, year: number, accountId: string, accountIdField: string) => {
            return (items as any[])
                .filter((item: any) => {
                    const itemDate = new Date(item[dateField]);
                    return item[accountIdField] === accountId && itemDate.getMonth() === month && itemDate.getFullYear() === year;
                })
                .reduce((sum: number, item: any) => sum + item[amountField], 0);
        };
        
        const currentMonthIncome = filterAndSum(payments, 'paymentDate', 'amount', currentMonth, currentYear, selectedAccount.id, 'bankAccountId');
        const prevMonthIncome = filterAndSum(payments, 'paymentDate', 'amount', prevMonth, prevMonthYear, selectedAccount.id, 'bankAccountId');

        const currentMonthExpenses = filterAndSum(expenses, 'purchaseDate', 'price', currentMonth, currentYear, selectedAccount.id, 'bankAccount');
        const prevMonthExpenses = filterAndSum(expenses, 'purchaseDate', 'price', prevMonth, prevMonthYear, selectedAccount.id, 'bankAccount');

        return { currentMonthIncome, prevMonthIncome, currentMonthExpenses, prevMonthExpenses };
    }, [payments, expenses, selectedAccount]);

    const transactionsWithBalance = useMemo(() => {
        if (!selectedAccount) return [];

        const sortedTransactions = [
            ...payments.filter(p => p.bankAccountId === selectedAccount.id).map(p => ({ type: 'income' as const, date: p.paymentDate, description: `Payment for Invoice ${p.invoiceId}`, amount: p.amount })),
            ...expenses.filter(e => e.bankAccount === selectedAccount.id).map(e => ({ type: 'expense' as const, date: e.purchaseDate, description: e.itemName, amount: e.price }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const result: ({ type: 'income' | 'expense', date: string, description: string, amount: number, balance: number })[] = [];
        let runningBalance = accountBalances.get(selectedAccount.id) || 0;
    
        for (const tx of sortedTransactions) {
            const balanceForRow = runningBalance;
            result.push({ ...tx, balance: balanceForRow });
            if (tx.type === 'income') {
                runningBalance -= tx.amount;
            } else { // expense
                runningBalance += tx.amount;
            }
        }
        
        return result;

    }, [selectedAccount, payments, expenses, accountBalances]);

    const handleSave = (accountData: Omit<BankAccount, 'id'>) => {
        if (accountToEdit) {
            onUpdateAccount({ ...accountData, id: accountToEdit.id });
        } else {
            onAddAccount(accountData);
        }
        setIsModalOpen(false);
    };

    const confirmDelete = () => {
        if (accountToDelete) {
            onDeleteAccount(accountToDelete.id);
            setAccountToDelete(null);
        }
    };

    if (selectedAccount && monthlyData) {
        return (
            <div className="animate-fade-in space-y-6">
                <button onClick={() => setSelectedAccount(null)} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Accounts</button>
                
                <div className="bg-slate-800 text-white rounded-xl p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-slate-300">{selectedAccount.bankName} - *...{selectedAccount.accountNumber.slice(-4)}</p>
                            <h2 className="text-2xl font-bold">{selectedAccount.accountName}</h2>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-slate-300">Current Balance</p>
                             <p className="text-4xl font-bold">{formatCurrency(accountBalances.get(selectedAccount.id) || 0, selectedAccount.currency)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                        <p className="font-semibold text-green-800">Income This Month</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(monthlyData.currentMonthIncome, selectedAccount.currency)}</p>
                    </div>
                     <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                        <p className="font-semibold text-red-800">Expenses This Month</p>
                        <p className="text-2xl font-bold text-red-700">{formatCurrency(monthlyData.currentMonthExpenses, selectedAccount.currency)}</p>
                    </div>
                </div>

                <MonthlyComparisonChart data={monthlyData} currency={selectedAccount.currency} />

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mt-2">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Transaction History</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="p-3 font-semibold w-8"></th>
                                        <th className="p-3 font-semibold">Date</th>
                                        <th className="p-3 font-semibold">Description</th>
                                        <th className="p-3 font-semibold text-right">Amount</th>
                                        <th className="p-3 font-semibold text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionsWithBalance.map((tx, i) => (
                                        <tr key={i} className="border-b border-gray-100 last:border-b-0">
                                            <td className="p-3">
                                                {tx.type === 'income' ? <ArrowUpCircleIcon className="w-6 h-6 text-green-500" /> : <ArrowDownCircleIcon className="w-6 h-6 text-red-500" />}
                                            </td>
                                            <td className="p-3 text-gray-600">{tx.date}</td>
                                            <td className="p-3 text-gray-800 font-medium">{tx.description}</td>
                                            <td className={`p-3 text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, selectedAccount.currency)}
                                            </td>
                                            <td className="p-3 text-right font-semibold text-gray-800">
                                                {formatCurrency(tx.balance, selectedAccount.currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {transactionsWithBalance.length === 0 && <p className="text-center py-10 text-gray-500">No transactions for this account yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in space-y-6">
            <Banner
                title="Bank Accounts"
                description="Manage your financial accounts."
                icon={BuildingLibraryIcon}
            />
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                    <div/>
                    <button onClick={() => { setAccountToEdit(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><PlusIcon className="w-5 h-5 mr-2" />Add Account</button>
                </div>

                {accounts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {accounts.map(acc => (
                            <div key={acc.id} className="bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-colors group cursor-pointer" onClick={() => setSelectedAccount(acc)}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600">{acc.accountName}</h3>
                                        <p className="text-sm text-gray-500">{acc.bankName} - *...{acc.accountNumber.slice(-4)}</p>
                                    </div>
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); setAccountToEdit(acc); setIsModalOpen(true); }} className="p-1 text-gray-500 hover:text-blue-600"><EditIcon className="w-4 h-4"/></button>
                                        <button onClick={(e) => { e.stopPropagation(); setAccountToDelete(acc); }} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-500">Current Balance</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(accountBalances.get(acc.id) || 0, acc.currency)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-gray-50/75 border border-dashed border-gray-200 rounded-xl py-20 flex flex-col items-center">
                        <BuildingLibraryIcon className="w-12 h-12 text-gray-400" />
                        <h3 className="mt-4 font-semibold text-gray-800">No Bank Accounts Added</h3>
                        <p className="text-sm text-gray-500">Click "Add Account" to get started.</p>
                    </div>
                )}
            </div>

            <AccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} accountToEdit={accountToEdit} />
            <ConfirmationModal isOpen={!!accountToDelete} onClose={() => setAccountToDelete(null)} onConfirm={confirmDelete} title="Delete Bank Account">
                Are you sure you want to delete this account? All associated transaction history will remain but will be unlinked.
            </ConfirmationModal>
        </div>
    );
};

export default BankAccountsPage;