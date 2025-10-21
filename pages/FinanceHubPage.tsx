import React from 'react';
import { View } from './DashboardPage';
import { CurrencyDollarIcon } from '../components/icons/CurrencyDollarIcon';
import { ChartPieIcon } from '../components/icons/ChartPieIcon';
import { CoinsIcon } from '../components/icons/CoinsIcon';
import { InvoicesIcon } from '../components/icons/InvoicesIcon';
import { PaymentsIcon } from '../components/icons/PaymentsIcon';
import { ExpensesIcon } from '../components/icons/ExpensesIcon';
import { BuildingLibraryIcon } from '../components/icons/BuildingLibraryIcon';
import { DocumentMagnifyingGlassIcon } from '../components/icons/DocumentMagnifyingGlassIcon';
import { Banner } from '../components/Banner';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';

interface FinanceHubPageProps {
    setActiveView: (view: View) => void;
}

const HubCard: React.FC<{
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
}> = ({ title, description, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center p-4 bg-white rounded-xl border border-slate-200 transition-all duration-200 group hover:border-blue-500 hover:shadow-md hover:-translate-y-1"
    >
        <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
            <Icon className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
        </div>
        <div className="ml-4 text-left flex-grow">
            <h3 className="font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        <ChevronRightIcon className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
    </button>
);

const FinanceSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">{title}</h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);


const FinanceHubPage: React.FC<FinanceHubPageProps> = ({ setActiveView }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <Banner
                title="Financial Hub"
                description="Manage your company's complete financial lifecycle, from quoting and billing to expense tracking and reconciliation."
                icon={CurrencyDollarIcon}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                
                <FinanceSection title="Sales & Billing Cycle">
                    <HubCard
                        title="Quotations"
                        description="Create and manage service quotes for leads and clients."
                        icon={CoinsIcon}
                        onClick={() => setActiveView('quotations')}
                    />
                     <HubCard
                        title="Invoices"
                        description="Track all invoices, their statuses, and associated operations."
                        icon={InvoicesIcon}
                        onClick={() => setActiveView('all_invoices')}
                    />
                    <HubCard
                        title="Payments"
                        description="Record and view all payments received from clients."
                        icon={PaymentsIcon}
                        onClick={() => setActiveView('all_payments')}
                    />
                </FinanceSection>
                
                <FinanceSection title="Expenses & Treasury">
                    <HubCard
                        title="Expenses"
                        description="Manage all company expenses and link them to operations."
                        icon={ExpensesIcon}
                        onClick={() => setActiveView('all_expenses')}
                    />
                    <HubCard
                        title="Bank Accounts"
                        description="Register and manage your company's bank accounts."
                        icon={BuildingLibraryIcon}
                        onClick={() => setActiveView('bank_accounts')}
                    />
                </FinanceSection>

                 <FinanceSection title="Analysis & Reconciliation">
                    <HubCard
                        title="Financial Overview"
                        description="Get a global view of invoices, payments, and expenses."
                        icon={ChartPieIcon}
                        onClick={() => setActiveView('finance')}
                    />
                    <HubCard
                        title="SAT Invoice Manager"
                        description="Synchronize and manage your issued and received SAT invoices."
                        icon={DocumentMagnifyingGlassIcon}
                        onClick={() => setActiveView('bank-reconciliation')}
                    />
                 </FinanceSection>
            </div>
        </div>
    );
};

export default FinanceHubPage;