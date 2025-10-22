import React, { useState, useMemo, useEffect } from 'react';
import { PlusIcon } from '../components/icons/PlusIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ProjectAvatar } from '../components/ProjectAvatar';
import { View, Project } from './DashboardPage';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { Banner } from '../components/Banner';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { FilterIcon } from '../components/icons/FilterIcon';
import { operationsService } from '../src/services/operationsService';

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Delivered': return 'bg-green-100 text-green-800';
        case 'In Transit': return 'bg-blue-100 text-blue-800';
        case 'On Hold': return 'bg-yellow-100 text-yellow-800';
        case 'Canceled': return 'bg-red-100 text-red-800';
        case 'Planning': return 'bg-gray-100 text-gray-800';
        case 'Customs Clearance': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const statuses = ['All', 'Delivered', 'In Transit', 'On Hold', 'Canceled', 'Planning', 'Customs Clearance'];


interface LogisticsProjectsPageProps {
  setActiveView: (view: View) => void;
  onViewOperation: (projectId: string) => void;
  projects?: Project[];
  onOperationsLoaded?: (projects: Project[]) => void;
}

const LogisticsProjectsPage: React.FC<LogisticsProjectsPageProps> = ({ setActiveView, onViewOperation, onOperationsLoaded }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await operationsService.getAll();
      const loadedProjects = data.map(op => ({
        ...op,
        assignees: (op.assignees || []).map((a: any) => a.user?.name || 'Unknown')
      }));
      setProjects(loadedProjects);
      
      // Pass loaded operations back to DashboardPage
      if (onOperationsLoaded) {
        onOperationsLoaded(loadedProjects);
      }
    } catch (err) {
      setError('Failed to load operations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
        const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
        
        const lowercasedQuery = searchQuery.toLowerCase().trim();
        if (lowercasedQuery === '') {
            return matchesStatus;
        }

        const matchesSearch = project.id.toLowerCase().includes(lowercasedQuery) ||
                              project.projectName.toLowerCase().includes(lowercasedQuery);
        
        return matchesStatus && matchesSearch;
    });
  }, [searchQuery, statusFilter, projects]);

  return (
    <div className="animate-fade-in space-y-6 h-full flex flex-col">
      <Banner
        title="Logistics Operations"
        description="Monitor, manage, and track all your ongoing and completed logistics projects from a centralized dashboard."
      />
      
      {/* Controls Bar */}
      <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow">
                 <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Search by name or ID..." 
                    className="pl-10 pr-4 py-2 w-full md:w-64 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-red-500 focus:border-red-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
            </div>
            <div className="relative">
                <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 appearance-none border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-red-500 focus:border-red-500"
                >
                    {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                </select>
            </div>
        </div>
        <button onClick={() => setActiveView('create-operation')} className="w-full md:w-auto flex items-center justify-center bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Operation
        </button>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-grow min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-300">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredProjects.map((project) => (
                  <tr key={project.id} onClick={() => onViewOperation(project.id)} className="hover:bg-slate-50 cursor-pointer group">
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-4">
                        <ProjectAvatar projectName={project.projectName} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate" title={project.projectName}>{project.projectName}</p>
                          <p className="text-xs font-mono text-slate-500">{project.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center -space-x-2">
                        {project.assignees.slice(0, 3).map(assignee => (
                           <div key={assignee} className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 border-2 border-white ring-2 ring-slate-100" title={assignee}>
                               {assignee.split(' ').map(n=>n[0]).join('')}
                           </div>
                        ))}
                        {project.assignees.length > 3 && (
                           <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 border-2 border-white ring-2 ring-slate-100">
                               +{project.assignees.length - 3}
                           </div>
                        )}
                         {project.assignees.length === 0 && (
                           <div className="text-xs text-slate-400 italic">Unassigned</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium align-middle">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                            <span>{project.deadline || 'N/A'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-red-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-600 w-8 text-right">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                        <ChevronRightIcon className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 flex flex-col items-center justify-center flex-grow">
              <div className="bg-slate-100 rounded-full p-5">
                  <ClipboardListIcon className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-800">No Operations Found</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                {searchQuery || statusFilter !== 'All' 
                    ? `No operations match your current filters. Try adjusting your search or filter.`
                    : `Get started by creating your first logistics operation.`
                }
              </p>
               <button onClick={() => setActiveView('create-operation')} className="mt-6 flex items-center bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Your First Operation
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogisticsProjectsPage;
