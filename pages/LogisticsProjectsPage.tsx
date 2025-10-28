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
import { TrashIcon } from '../components/icons/TrashIcon';
import { TruckIcon } from '../components/icons/TruckIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from '../components/icons/ExclamationTriangleIcon';
import { ChartPieIcon } from '../components/icons/ChartPieIcon';
import { operationsService } from '../src/services/operationsService';
import { ConfirmationModal } from '../components/ConfirmationModal';

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
  teamMembers: { id: string; name: string; email: string; role: string; phone?: string }[];
}

const LogisticsProjectsPage: React.FC<LogisticsProjectsPageProps> = ({ setActiveView, onViewOperation, onOperationsLoaded, teamMembers }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [operationToDelete, setOperationToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await operationsService.getAll();
      
      // Keep assignees as employee IDs - do NOT transform them here
      setProjects(data);

      // Pass loaded operations back to DashboardPage with original IDs
      if (onOperationsLoaded) {
        onOperationsLoaded(data);
      }
    } catch (err) {
      setError('Failed to load operations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredProjects.length;
    const byStatus = filteredProjects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const avgProgress = total > 0 
      ? Math.round(filteredProjects.reduce((sum, p) => sum + p.progress, 0) / total)
      : 0;
    
    const needsAttention = filteredProjects.filter(p => p.needsAttention).length;
    const autoCreated = filteredProjects.filter(p => p.autoCreated).length;
    
    return {
      total,
      byStatus,
      avgProgress,
      needsAttention,
      autoCreated,
      delivered: byStatus['Delivered'] || 0,
      inTransit: byStatus['In Transit'] || 0,
      planning: byStatus['Planning'] || 0,
    };
  }, [filteredProjects]);

  const handleDeleteOperation = async () => {
    if (!operationToDelete) return;

    try {
      setIsDeleting(true);
      await operationsService.delete(operationToDelete.id);
      window.location.reload(); // Recargar para actualizar la lista
    } catch (error) {
      console.error('Error deleting operation:', error);
      alert('Error al eliminar la operación');
    } finally {
      setIsDeleting(false);
      setOperationToDelete(null);
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

      {/* Statistics Cards */}
      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase">Total</span>
              <ClipboardListIcon className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{statistics.total}</p>
            <p className="text-xs text-slate-500 mt-1">Operaciones</p>
          </div>

          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-600 uppercase">En Tránsito</span>
              <TruckIcon className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{statistics.inTransit}</p>
            <p className="text-xs text-blue-600 mt-1">{statistics.total > 0 ? Math.round((statistics.inTransit / statistics.total) * 100) : 0}% del total</p>
          </div>

          <div className="bg-green-50 rounded-lg border border-green-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-600 uppercase">Completadas</span>
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-700">{statistics.delivered}</p>
            <p className="text-xs text-green-600 mt-1">{statistics.total > 0 ? Math.round((statistics.delivered / statistics.total) * 100) : 0}% del total</p>
          </div>

          <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-purple-600 uppercase">Planificación</span>
              <CalendarIcon className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-700">{statistics.planning}</p>
            <p className="text-xs text-purple-600 mt-1">{statistics.total > 0 ? Math.round((statistics.planning / statistics.total) * 100) : 0}% del total</p>
          </div>

          <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-amber-600 uppercase">Atención</span>
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-700">{statistics.needsAttention}</p>
            <p className="text-xs text-amber-600 mt-1">Requieren revisión</p>
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 uppercase">Progreso</span>
              <ChartPieIcon className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-slate-700">{statistics.avgProgress}%</p>
            <p className="text-xs text-slate-500 mt-1">Promedio general</p>
          </div>
        </div>
      )}

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
        <button 
          onClick={() => {
            console.log('Navigating to create-operation view');
            setActiveView('create-operation');
          }} 
          className="w-full md:w-auto flex items-center justify-center bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
        >
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
          <div className="overflow-y-auto p-4">
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  onClick={() => onViewOperation(project.id)}
                  className={`group bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                    project.needsAttention ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left section - Project info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <ProjectAvatar projectName={project.projectName} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800 truncate">{project.projectName}</h3>
                          {project.autoCreated && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                              🤖 Auto
                            </span>
                          )}
                          {project.needsAttention && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 whitespace-nowrap">
                              ⚠️ Atención
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs font-mono text-slate-500 mb-3">{project.id}</p>
                        
                        {/* Bottom info row */}
                        <div className="flex items-center gap-6 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{project.deadline || 'Sin fecha límite'}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          
                          {/* Team avatars */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-1.5">
                              {(project.assignees || [])
                                .filter((id: string) => id && id !== 'Unknown')
                                .slice(0, 3)
                                .map((employeeId: string) => {
                                  const member = teamMembers.find(m => m.id === employeeId);
                                  const name = member?.name || 'Unknown';
                                  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
                                  return (
                                    <div 
                                      key={employeeId} 
                                      className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white" 
                                      title={name}
                                    >
                                      {initials}
                                    </div>
                                  );
                                })}
                              {(project.assignees || []).filter((id: string) => id && id !== 'Unknown').length > 3 && (
                                <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 border-2 border-white">
                                  +{(project.assignees || []).filter((id: string) => id && id !== 'Unknown').length - 3}
                                </div>
                              )}
                            </div>
                            {(project.assignees || []).filter((id: string) => id && id !== 'Unknown').length === 0 && (
                              <span className="text-slate-400 italic">Sin asignar</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right section - Progress & Actions */}
                    <div className="flex items-center gap-4">
                      {/* Progress circle */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-14 h-14">
                          <svg className="transform -rotate-90 w-14 h-14">
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-slate-200"
                            />
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 24}`}
                              strokeDashoffset={`${2 * Math.PI * 24 * (1 - project.progress / 100)}`}
                              className="text-red-600 transition-all duration-300"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-700">{project.progress}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOperationToDelete(project);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" 
                        title="Eliminar"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
               <button 
                onClick={() => {
                  console.log('Navigating to create-operation view from empty state');
                  setActiveView('create-operation');
                }} 
                className="mt-6 flex items-center bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Operation
              </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!operationToDelete}
        onClose={() => setOperationToDelete(null)}
        onConfirm={handleDeleteOperation}
        title="Eliminar Operación"
        message={`¿Estás seguro de que deseas eliminar la operación "${operationToDelete?.projectName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default LogisticsProjectsPage;