import React, { useState, useMemo, useEffect } from 'react';
import { Expense, TeamMember, BankAccount, Currency } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ExpensePanel } from '../components/ExpensePanel';
import { TagIcon } from '../components/icons/TagIcon';
import { CurrencyDollarIcon } from '../components/icons/CurrencyDollarIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { BriefcaseIcon } from '../components/icons/BriefcaseIcon';
import { BuildingLibraryIcon } from '../components/icons/BuildingLibraryIcon';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';
import { ShoppingCartIcon } from '../components/icons/ShoppingCartIcon';
import { QuestionMarkCircleIcon } from '../components/icons/QuestionMarkCircleIcon';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TruckIcon } from '../components/icons/TruckIcon';
import { WarehouseIcon } from '../components/icons/WarehouseIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { PaperAirplaneIcon } from '../components/icons/PaperAirplaneIcon';

interface ExpensesManagerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  teamMembers: TeamMember[];
  operationId: string;
  bankAccounts: BankAccount[];
}

const expenseCategoryIcons: { [key: string]: React.ElementType } = {
  'Port Charges': BriefcaseIcon,
  'Customs Fees': BuildingLibraryIcon,
  'Transportation': TruckIcon,
  'Warehousing': WarehouseIcon,
  'Documentation': DocumentTextIcon,
  'Office Supplies': ShoppingCartIcon,
  'Rent': BuildingLibraryIcon,
  'Utilities': CurrencyDollarIcon,
  'Gasoline': TruckIcon,
  'Food & Dining': ShoppingCartIcon,
  'Travel': PaperAirplaneIcon,
  'Events': CalendarIcon,
  'Other': QuestionMarkCircleIcon,
};

const formatCurrency = (amount: number, currency: string) => 
    `${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;

const aggregateByCategory = (items: Expense[]) => {
    if (!items || items.length === 0) return [];
    
    const totalsByCategory = items.reduce((acc, item) => {
        const category = item.expenseCategory || 'Other';
        const currentTotal = acc[category] || 0;
        const amount = Number(item.price) || 0;
        acc[category] = currentTotal + amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(totalsByCategory)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
};

const ExpensesByCategoryChart: React.FC<{ data: { category: string; total: number }[], currency: string }> = ({ data, currency }) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true) }, []);

    if (!data || data.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200 min-h-[200px]">
                <ChartBarIcon className="w-10 h-10 text-gray-300 mb-2" />
                <p className="font-semibold text-gray-600">No Expense Data</p>
                <p className="text-xs">Add expenses to see a breakdown by category.</p>
            </div>
        );
    }
    
    const maxValue = Math.max(...data.map(d => d.total));

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center mb-4">
                <ChartBarIcon className="w-6 h-6 text-gray-500 mr-3" />
                <h3 className="text-lg font-bold text-gray-800">Expenses by Category ({currency})</h3>
            </div>
            <div className="space-y-3">
                {data.map((item, index) => {
                    const widthPercentage = (item.total / maxValue) * 100;
                    return (
                        <div key={item.category} className="group">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-semibold text-gray-700">{item.category}</span>
                                <span className="font-bold text-gray-800">
                                    {formatCurrency(item.total, currency)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                    className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out group-hover:bg-blue-600"
                                    style={{ width: isMounted ? `${widthPercentage}%` : '0%' }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const ExpensesManager: React.FC<ExpensesManagerProps> = (props) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

    const expensesByCurrency = useMemo(() => {
        return props.expenses.reduce((acc, exp) => {
            if (!acc[exp.currency]) {
                acc[exp.currency] = [];
            }
            acc[exp.currency].push(exp);
            return acc;
        }, {} as Record<string, Expense[]>);
    }, [props.expenses]);

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsPanelOpen(true);
    };
    
    const handleDeleteClick = (expenseId: string) => {
        setExpenseToDeleteId(expenseId);
    };

    const confirmDelete = () => {
        if (expenseToDeleteId) {
            props.onDeleteExpense(expenseToDeleteId);
        }
        setExpenseToDeleteId(null);
    };
    
    const cancelDelete = () => {
        setExpenseToDeleteId(null);
    };

    const handleSave = (expenseData: Omit<Expense, 'id'>) => {
        if (editingExpense) {
            props.onUpdateExpense({ ...expenseData, id: editingExpense.id });
        } else {
            props.onAddExpense(expenseData);
        }
        setIsPanelOpen(false);
        setEditingExpense(null);
    };

    const handleCancel = () => {
        setIsPanelOpen(false);
        setEditingExpense(null);
    };

    const handleAddNew = () => {
        setEditingExpense(null);
        setIsPanelOpen(true);
    };

    return (
        <div className="space-y-6">
            {Object.entries(expensesByCurrency).map(([currency, expensesInCurrency]) => {
                const totals = aggregateByCategory(expensesInCurrency as Expense[]);
                return <ExpensesByCategoryChart key={currency} data={totals} currency={currency} />
            })}

            <div className="flex justify-between items-center pt-6 border-t">
                 <h3 className="text-xl font-bold text-gray-800">Operation Expenses</h3>
                 <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Expense
                </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="text-xs text-left text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Item</th>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3 text-right">Amount</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {props.expenses.map(exp => {
                            const CategoryIcon = expenseCategoryIcons[exp.expenseCategory] || QuestionMarkCircleIcon;
                            return (
                                <tr key={exp.id} className="hover:bg-gray-50/70">
                                    <td className="px-6 py-4 font-medium text-gray-800">{exp.itemName}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon className="w-5 h-5 text-gray-400" />
                                            <span>{exp.expenseCategory}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{exp.purchaseDate}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-800">{formatCurrency(exp.price, exp.currency)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleEdit(exp)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full transition-colors"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDeleteClick(exp.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {props.expenses.length === 0 && (
                    <div className="text-center text-gray-500 py-16">
                        <p className="font-medium">No expenses recorded yet.</p>
                        <p className="text-sm">Click "Add Expense" to get started.</p>
                    </div>
                )}
            </div>

            <ExpensePanel
                isOpen={isPanelOpen}
                onClose={handleCancel}
                onSave={handleSave}
                expenseToEdit={editingExpense}
                teamMembers={props.teamMembers}
                operationId={props.operationId}
                bankAccounts={props.bankAccounts}
            />

            <ConfirmationModal
                isOpen={!!expenseToDeleteId}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title="Delete Expense"
            >
                Are you sure you want to delete this expense? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
};

export default ExpensesManager;