import React from 'react';
import { Project, Client, Invoice, Expense, View, Task, Column } from './DashboardPage';

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
        <div className="animate-fade-in">
            {/* Empty dashboard */}
        </div>
    );
};

export default DashboardPageContent;