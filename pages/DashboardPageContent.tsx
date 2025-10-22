import React from 'react';
import { Project, Client, Invoice, Expense, View, Task, Column } from './DashboardPage';
import { GridIcon } from '../components/icons/GridIcon';
import { TruckIcon } from '../components/icons/TruckIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { TasksIcon } from '../components/icons/TasksIcon';
import { ChartPieIcon } from '../components/icons/ChartPieIcon';
import { Banner } from '../components/Banner';
import { StatCard } from '../components/dashboard/StatCard';
import { GlobalShipmentsMap } from '../components/dashboard/GlobalShipmentsMap';
import { ShipmentStatusChart } from '../components/dashboard/ShipmentStatusChart';
import { ProjectAvatar } from '../components/ProjectAvatar';

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

const UpcomingTasksCard: React.FC<{ tasks: Record<string, Task>, columns: Record<string, Column>, projects: Project[], onViewOperation: (id: string) => void }> = ({ tasks, columns, projects, onViewOperation }) => {
    const upcomingTasks = useMemo(() => {
        // Explicitly type the `c` parameter to resolve `unknown` type errors.
        const doneColumnIds = Object.values(columns)
          .filter((c: Column) => c.title.toLowerCase() === 'done')
          .map((c: Column) => c.id);
        const doneTaskIds = new Set(doneColumnIds.flatMap(id => columns[id]?.taskIds || []));

        return Object.values(tasks)
            // Explicitly type the `task` parameter to resolve `unknown` type errors.
            .filter((task: Task) => !doneTaskIds.has(task.id) && task.dueDate)
            // Explicitly type the `a` and `b` parameters to resolve `unknown` type errors.
            .sort((a: Task, b: Task) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5)
            .map((task: Task) => ({
                ...task,
                projectName: projects.find(p => p.id === task.operationId)?.projectName || 'Unknown Project'
            }));
    }, [tasks, columns, projects]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200"><h3 className="text-lg font-bold text-gray-800">Upcoming Deadlines</h3></div>
            <div className="p-4 space-y-3">
                {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                    <div key={task.id} onClick={() => onViewOperation(task.operationId)} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <p className="font-semibold text-sm text-gray-800">{task.title}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                            <span className="font-medium text-blue-600">{task.projectName}</span>
                            <span className="font-semibold text-red-600">{task.dueDate}</span>
                        </div>
                    </div>
                )) : <p className="text-center text-sm text-gray-500 py-8">No upcoming tasks.</p>}
            </div>
        </div>
    );
};


const DashboardPageContent: React.FC<DashboardPageContentProps> = ({ projects, clients, invoices, expenses, tasks, columns, setActiveView, onViewOperation }) => {
    
    const { activeProjects, totalRevenue, totalClients, pendingTasks } = useMemo(() => {
        const activeProjects = projects.filter(p => p.status !== 'Delivered' && p.status !== 'Canceled').length;
    
        const totalRevenue = invoices.reduce((sum, inv) => {
            const rate = inv.currency === 'MXN' ? 1/18 : inv.currency === 'EUR' ? 1.1 : 1;
            return sum + (inv.total * rate);
        }, 0);

        const totalClients = clients.length;
        
        // Explicitly type the `c` parameter to resolve `unknown` type errors.
        const doneColumnIds = Object.values(columns).filter((c: Column) => c.title.toLowerCase() === 'done').map((c: Column) => c.id);
        const doneTaskIds = new Set(doneColumnIds.flatMap(id => columns[id]?.taskIds || []));
        // Explicitly type the `task` parameter to resolve `unknown` type error on `task.id`.
        const pendingTasks = Object.values(tasks).filter((task: Task) => !doneTaskIds.has(task.id)).length;

        return { activeProjects, totalRevenue, totalClients, pendingTasks };
    }, [projects, clients, invoices, tasks, columns]);

    return (
        <div className="animate-fade-in space-y-4 md:space-y-6">
            <Banner
                title="Logistics Command Center"
                description="Real-time overview of your global supply chain operations."
                icon={GridIcon}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Active Shipments" value="0" icon={TruckIcon} change="+0" changeType="increase" />
                <StatCard title="Total Revenue (USD)" value="$0.0k" icon={ChartPieIcon} change="+0%" changeType="increase" />
                <StatCard title="Total Clients" value="0" icon={UsersIcon} change="+0" changeType="increase" />
                <StatCard title="Pending Tasks" value="0" icon={TasksIcon} change="-0" changeType="decrease" />
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
                <div className="xl:col-span-2 min-w-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex-shrink-0">Live Global Shipments</h3>
                        <div className="flex-grow flex items-center justify-center min-h-[300px]">
                            <div className="text-center text-gray-400">
                                <TruckIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">No active shipments</p>
                                <p className="text-sm mt-2">Start by creating your first operation</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4 md:space-y-6 min-w-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Shipment Status Breakdown</h3>
                        <div className="flex items-center justify-center min-h-[200px]">
                            <div className="text-center text-gray-400">
                                <ChartPieIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-medium">No data available</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">Upcoming Deadlines</h3>
                        </div>
                        <div className="p-4">
                            <div className="text-center text-gray-400 py-8">
                                <TasksIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-medium">No upcoming tasks</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPageContent;