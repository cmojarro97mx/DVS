import React, { useState, useEffect, useMemo } from 'react';
import { View, Expense, TeamMember, BankAccount } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ExpensePanel } from '../components/ExpensePanel';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ExpensesIcon } from '../components/icons/ExpensesIcon';
import { Banner } from '../components/Banner';
import { expensesService } from '../src/services/expensesService';
import { operationsService } from '../src/services/operationsService';
import { employeesService } from '../src/services/employeesService';
import { bankAccountsService } from '../src/services/bankAccountsService';

interface AllExpensesPageProps {
  setActiveView: (view: View) => void;
}

const AllExpensesPage: React.FC<AllExpensesPageProps> = ({ setActiveView }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [operations, setOperations] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [expensesData, operationsData, employeesData, bankAccountsData] = await Promise.all([
                expensesService.getAll(),
                operationsService.getAll(),
                employeesService.getAll(),
                bankAccountsService.getAll()
            ]);
            setExpenses(expensesData as any);
            setOperations(operationsData);
            setTeamMembers(employeesData as any);
            setBankAccounts(bankAccountsData as any);
        } catch (error) {
            console.error('Error loading expenses data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const projectMap = useMemo(() => new Map(operations.map(p => [p.id, p.projectName])), [operations]);

    const filteredExpenses = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase().trim();
        if (lowercasedQuery === '') return expenses;
        return expenses.filter(exp => 
            exp.itemName.toLowerCase().includes(lowercasedQuery) ||
            (projectMap.get(exp.operationId) || '').toLowerCase().includes(lowercasedQuery)
        );
    }, [expenses, searchQuery, projectMap]);

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsPanelOpen(true);
    };

    const handleDeleteClick = (expenseId: string) => {
        setExpenseToDeleteId(expenseId);
    };
    
    const confirmDelete = async () => {
        if (expenseToDeleteId) {
            try {
                await expensesService.delete(expenseToDeleteId);
                await loadData();
            } catch (error) {
                console.error('Error deleting expense:', error);
            }
        }
        setExpenseToDeleteId(null);
    };

    const handleSave = async (expenseData: Omit<Expense, 'id'>) => {
        try {
            if (editingExpense) {
                await expensesService.update(editingExpense.id, expenseData);
            } else {
                await expensesService.create(expenseData as any);
            }
            await loadData();
            setIsPanelOpen(false);
            setEditingExpense(null);
        } catch (error) {
            console.error('Error saving expense:', error);
        }
    };

    const handleAddNew = () => {
        setEditingExpense(null);
        setIsPanelOpen(true);
    };

    const formatCurrency = (amount: number, currency: string) => 
        `${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;

    if (loading) {
        return (
            <div className="animate-fade-in space-y-6">
                <Banner
                    title="All Expenses"
                    description="Manage all company expenses and link them to operations."
                    icon={ExpensesIcon}
                />
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading expenses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <Banner
                title="All Expenses"
                description="Manage all company expenses and link them to operations."
                icon={ExpensesIcon}
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setActiveView('finance')} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Financial Overview
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="Search expenses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Add Expense
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Item Name</th>
                                <th scope="col" className="px-6 py-3">Operation</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{exp.itemName}</td>
                                    <td className="px-6 py-4 text-blue-600 font-medium">{projectMap.get(exp.operationId) || exp.operationId}</td>
                                    <td className="px-6 py-4">{exp.purchaseDate}</td>
                                    <td className="px-6 py-4">{exp.expenseCategory}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(exp.price, exp.currency)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleEdit(exp)} className="p-1 text-gray-400 hover:text-blue-600"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteClick(exp.id)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredExpenses.length === 0 && (
                        <div className="text-center bg-gray-50/75 border-t py-20 flex flex-col items-center justify-center">
                            <div className="bg-gray-200 rounded-full p-5">
                                <ExpensesIcon className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="mt-6 text-lg font-semibold text-gray-800">No Expenses Found</h3>
                            <p className="mt-1 text-sm text-gray-500">Click "Add Expense" to get started.</p>
                        </div>
                    )}
                </div>

                <ExpensePanel
                    isOpen={isPanelOpen}
                    onClose={() => setIsPanelOpen(false)}
                    onSave={handleSave}
                    expenseToEdit={editingExpense}
                    teamMembers={teamMembers}
                    projects={projects}
                    bankAccounts={bankAccounts}
                />

                <ConfirmationModal
                    isOpen={!!expenseToDeleteId}
                    onClose={() => setExpenseToDeleteId(null)}
                    onConfirm={confirmDelete}
                    title="Delete Expense"
                >
                    Are you sure you want to delete this expense? This action cannot be undone.
                </ConfirmationModal>
            </div>
        </div>
    );
};

export default AllExpensesPage;