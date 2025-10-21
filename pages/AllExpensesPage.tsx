import React, { useState, useMemo } from 'react';
import { Expense, TeamMember, Project, View, BankAccount } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ExpensePanel } from '../components/ExpensePanel';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ExpensesIcon } from '../components/icons/ExpensesIcon';
import { Banner } from '../components/Banner';

interface AllExpensesPageProps {
  setActiveView: (view: View) => void;
  expenses: Expense[];
  projects: Project[];
  teamMembers: TeamMember[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  bankAccounts: BankAccount[];
}

const AllExpensesPage: React.FC<AllExpensesPageProps> = (props) => {
    const { setActiveView, expenses, projects, teamMembers, onAddExpense, onUpdateExpense, onDeleteExpense, bankAccounts } = props;
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.projectName])), [projects]);

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
    
    const confirmDelete = () => {
        if (expenseToDeleteId) {
            onDeleteExpense(expenseToDeleteId);
        }
        setExpenseToDeleteId(null);
    };

    const handleSave = (expenseData: Omit<Expense, 'id'>) => {
        if (editingExpense) {
            onUpdateExpense({ ...expenseData, id: editingExpense.id });
        } else {
            onAddExpense(expenseData);
        }
        setIsPanelOpen(false);
        setEditingExpense(null);
    };

    const handleAddNew = () => {
        setEditingExpense(null);
        setIsPanelOpen(true);
    };

    const formatCurrency = (amount: number, currency: string) => 
        `${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;

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