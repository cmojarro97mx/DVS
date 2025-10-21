import React, { useState, useMemo } from 'react';
import { Payment, Invoice, Project, View } from './DashboardPage';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PaymentsIcon } from '../components/icons/PaymentsIcon';
import { Banner } from '../components/Banner';

interface AllPaymentsPageProps {
  setActiveView: (view: View) => void;
  payments: Payment[];
  invoices: Invoice[];
  projects: Project[];
  onViewOperation: (projectId: string) => void;
}

const AllPaymentsPage: React.FC<AllPaymentsPageProps> = ({ setActiveView, payments, invoices, projects, onViewOperation }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const enrichedPayments = useMemo(() => {
        const invoiceMap = new Map<string, { number: string; currency: string; }>(invoices.map(i => [i.id, { number: i.invoiceNumber, currency: i.currency }]));
        const projectMap = new Map(projects.map(p => [p.id, p.projectName]));
        
        return payments.map(p => ({
            ...p,
            invoiceNumber: invoiceMap.get(p.invoiceId)?.number || 'N/A',
            currency: invoiceMap.get(p.invoiceId)?.currency || 'USD',
            projectName: projectMap.get(p.operationId) || 'Unknown Project'
        }));
    }, [payments, invoices, projects]);
    
    const filteredPayments = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase().trim();
        if (lowercasedQuery === '') return enrichedPayments;
        return enrichedPayments.filter(p => 
            p.invoiceNumber.toLowerCase().includes(lowercasedQuery) ||
            p.projectName.toLowerCase().includes(lowercasedQuery) ||
            p.paymentMethod.toLowerCase().includes(lowercasedQuery)
        );
    }, [enrichedPayments, searchQuery]);

    const formatCurrency = (amount: number, currency: string) => 
        `${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;

    return (
        <div className="animate-fade-in space-y-6">
            <Banner
                title="All Payments"
                description="Record and view all payments received from clients."
                icon={PaymentsIcon}
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setActiveView('finance')} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Financial Overview
                    </button>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search payments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Invoice #</th>
                                <th scope="col" className="px-6 py-3">Operation</th>
                                <th scope="col" className="px-6 py-3">Payment Date</th>
                                <th scope="col" className="px-6 py-3">Method</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map(p => (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.invoiceNumber}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => onViewOperation(p.operationId)} className="text-blue-600 hover:underline font-medium">
                                            {p.projectName} ({p.operationId})
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">{p.paymentDate}</td>
                                    <td className="px-6 py-4">{p.paymentMethod}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(p.amount, p.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredPayments.length === 0 && (
                        <div className="text-center bg-gray-50/75 border-t py-20 flex flex-col items-center justify-center">
                            <div className="bg-gray-200 rounded-full p-5">
                                <PaymentsIcon className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="mt-6 text-lg font-semibold text-gray-800">No Payments Found</h3>
                            <p className="mt-1 text-sm text-gray-500">Payments will appear here once recorded in an operation.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllPaymentsPage;