import React from 'react';
import { Project, Client, Invoice, Expense, View, Task, Column } from './DashboardPage';
import { GridIcon } from '../components/icons/GridIcon';
import { Banner } from '../components/Banner';

interface DashboardPageContentProps {
  projects: Project[];
  clients: Client[];
  invoices: Invoice[];
  expenses: Expense[];
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  setActiveView: (view: View) => void;
  onViewOperation: (projectId: string) => void;
}

const DashboardPageContent: React.FC<DashboardPageContentProps> = ({ projects, clients, invoices, expenses, tasks, columns, setActiveView, onViewOperation }) => {
    return (
        <div className="animate-fade-in space-y-4 md:space-y-6">
            <Banner
                title="Logistics Command Center"
                description="Real-time overview of your global supply chain operations."
                icon={GridIcon}
            />

            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                    <GridIcon className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Your Dashboard</h2>
                    <p className="text-gray-500 max-w-md">
                        Your operations dashboard is ready. Start by creating your first operation or exploring the available modules.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPageContent;