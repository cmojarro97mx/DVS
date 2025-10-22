
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TeamMember } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Banner } from '../components/Banner';
import { UsersIcon } from '../components/icons/UsersIcon';
import { MoreVerticalIcon } from '../components/icons/MoreVerticalIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { XIcon } from '../components/icons/XIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { NotesIcon } from '../components/icons/NotesIcon';
import { EmailIcon } from '../components/icons/EmailIcon';
import { PhoneIcon } from '../components/icons/PhoneIcon';
import { employeesService } from '../src/services/employeesService';

// --- Local Components (to avoid creating new files) ---

// Avatar Component
const colors = [
  'bg-red-200 text-red-800', 'bg-yellow-200 text-yellow-800',
  'bg-green-200 text-green-800', 'bg-blue-200 text-blue-800',
  'bg-indigo-200 text-indigo-800', 'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800', 'bg-orange-200 text-orange-800',
];
const getColorForString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash % colors.length)];
};
const EmployeeAvatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || name[0]?.toUpperCase() || 'E';
  const colorClass = getColorForString(name);
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };
  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${colorClass}`} title={name}>
      {initials}
    </div>
  );
};

// Puestos predeterminados para panel logístico
const LOGISTICS_ROLES = [
    'CEO',
    'Gerente General',
    'Director de Operaciones',
    'Gerente de Operaciones',
    'Coordinador de Operaciones',
    'Coordinador de Importaciones',
    'Coordinador de Exportaciones',
    'Agente Aduanal',
    'Director Comercial',
    'Gerente de Ventas',
    'Ejecutivo de Ventas',
    'Ejecutivo de Cuentas',
    'Especialista en Pricing',
    'Analista de Pricing',
    'Gerente de Pricing',
    'Coordinador de Tráfico',
    'Despachador',
    'Gerente de Almacén',
    'Supervisor de Almacén',
    'Coordinador Logístico',
    'Analista de Logística',
    'Servicio al Cliente',
    'Gerente de Atención al Cliente',
    'Gerente de RRHH',
    'Contador',
    'Gerente Financiero',
    'Asistente Administrativo',
    'Recepcionista',
];

// Employee Modal Component
const EmployeeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: any) => void;
    employeeToEdit: TeamMember | null;
}> = ({ isOpen, onClose, onSave, employeeToEdit }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', role: '', status: 'Active' as 'Active' | 'Inactive',
    });

    useEffect(() => {
        if (isOpen) {
            if (employeeToEdit) {
                setFormData({
                    name: employeeToEdit.name,
                    email: employeeToEdit.email,
                    phone: employeeToEdit.phone || '',
                    role: employeeToEdit.role,
                    status: employeeToEdit.status,
                });
            } else {
                setFormData({ name: '', email: '', phone: '', role: '', status: 'Active' });
            }
        }
    }, [employeeToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    const baseInputClasses = "block w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
    const labelClasses = "block text-sm font-semibold text-gray-700 mb-2";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-gray-800">{employeeToEdit ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}</h3>
                        <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                           <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
                        <div>
                            <label className={labelClasses}>Nombre Completo *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className={baseInputClasses} placeholder="Ej: Juan Pérez" required />
                        </div>
                        <div>
                            <label className={labelClasses}>Puesto *</label>
                            <select name="role" value={formData.role} onChange={handleChange} className={baseInputClasses} required>
                                <option value="">Seleccionar puesto...</option>
                                {LOGISTICS_ROLES.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClasses}>Correo Electrónico *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className={baseInputClasses} placeholder="ejemplo@empresa.com" required />
                            </div>
                            <div>
                                <label className={labelClasses}>Teléfono</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={baseInputClasses} placeholder="+52 123 456 7890" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Estado</label>
                            <select name="status" value={formData.status} onChange={handleChange} className={baseInputClasses}>
                                <option value="Active">Activo</option>
                                <option value="Inactive">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:shadow-md">{employeeToEdit ? 'Guardar Cambios' : 'Agregar Empleado'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main Page Component ---
interface EmployeesPageProps {}

const EmployeesPage: React.FC<EmployeesPageProps> = () => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<TeamMember | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<TeamMember | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'notes'>('overview');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const employeesData = await employeesService.getAll();
            setTeamMembers(employeesData as any);
        } catch (error) {
            console.error('Error loading employees data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredEmployees = useMemo(() => {
        return teamMembers.filter(e => {
            const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
            if (!matchesStatus) return false;

            const lowercasedQuery = searchQuery.toLowerCase().trim();
            if (lowercasedQuery === '') return true;

            return e.name.toLowerCase().includes(lowercasedQuery) || 
                   e.role.toLowerCase().includes(lowercasedQuery) ||
                   e.email.toLowerCase().includes(lowercasedQuery);
        });
    }, [teamMembers, searchQuery, statusFilter]);

    const handleAddNew = () => {
        setEmployeeToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (employee: TeamMember) => {
        setEmployeeToEdit(employee);
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const handleSave = async (employeeData: any) => {
        try {
            const userData: any = {
                name: employeeData.name,
                email: employeeData.email,
                role: employeeData.role,
                status: employeeData.status,
            };

            if (employeeData.phone) {
                userData.phone = employeeData.phone;
            }

            if (employeeToEdit) {
                await employeesService.update(employeeToEdit.id, userData);
            } else {
                await employeesService.create(userData);
            }
            await loadData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving employee:', error);
        }
    };

    const handleDeleteRequest = (employee: TeamMember) => {
        setEmployeeToDelete(employee);
        setActiveMenu(null);
    };

    const confirmDelete = async () => {
        if(employeeToDelete) {
            try {
                await employeesService.delete(employeeToDelete.id);
                await loadData();
                setEmployeeToDelete(null);
            } catch (error) {
                console.error('Error deleting employee:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="animate-fade-in space-y-6">
                <Banner
                    title="Employee Management"
                    description="Administer your team, manage roles, and track employee information."
                    icon={UsersIcon}
                />
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    <p className="mt-4 text-gray-600">Loading employees...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6 h-full flex flex-col">
            {/* Header Banner con información general */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                            <UsersIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Employee Management</h1>
                            <p className="text-sm text-gray-500 mt-1">Gestiona tu equipo de trabajo</p>
                        </div>
                    </div>
                </div>

                {/* Stats Row - Responsive Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <p className="text-xs text-blue-700 uppercase font-semibold mb-1">Total Empleados</p>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1">{teamMembers.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <p className="text-xs text-green-700 uppercase font-semibold mb-1">Activos</p>
                        <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-1">
                            {teamMembers.filter(e => e.status === 'Active').length}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-700 uppercase font-semibold mb-1">Inactivos</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                            {teamMembers.filter(e => e.status === 'Inactive').length}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <p className="text-xs text-purple-700 uppercase font-semibold mb-1">Departamentos</p>
                        <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-1">
                            {new Set(teamMembers.map(e => e.role)).size}
                        </p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-4 sm:gap-6 mt-6 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                            activeTab === 'overview'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <UsersIcon className="w-5 h-5" />
                        Vista General
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    {/* Controls Bar - Responsive */}
                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-grow lg:flex-grow-0">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nombre, puesto o email..." 
                                    className="pl-10 pr-4 py-2.5 w-full lg:w-72 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select 
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="All">Todos los estados</option>
                                <option value="Active">Activos</option>
                                <option value="Inactive">Inactivos</option>
                            </select>
                        </div>
                        <button 
                            onClick={handleAddNew} 
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Agregar Empleado</span>
                            <span className="sm:hidden">Agregar</span>
                        </button>
                    </div>

                    {/* Employees List - Professional Design */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {filteredEmployees.length > 0 ? (
                            <div className="overflow-x-auto">
                                {/* Desktop Table View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full min-w-max">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Empleado</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Puesto</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Contacto</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Estado</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredEmployees.map(employee => (
                                                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 align-middle">
                                                        <div className="flex items-center gap-3 min-w-max">
                                                            <EmployeeAvatar name={employee.name} />
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-gray-800 text-base whitespace-nowrap">{employee.name}</p>
                                                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1 whitespace-nowrap">
                                                                    <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                                                    <span>{employee.hireDate || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-middle">
                                                        <p className="font-semibold text-gray-800 whitespace-nowrap">{employee.role}</p>
                                                    </td>
                                                    <td className="px-6 py-4 align-middle">
                                                        <div className="space-y-1 min-w-max">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <EmailIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                <span className="whitespace-nowrap">{employee.email}</span>
                                                            </div>
                                                            {employee.phone && (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                    <span className="whitespace-nowrap">{employee.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-middle">
                                                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${employee.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                                            {employee.status === 'Active' ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 align-middle">
                                                        <div className="flex justify-center">
                                                            <div className="relative inline-block">
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenu(activeMenu === employee.id ? null : employee.id);
                                                                    }} 
                                                                    className="p-2 text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <MoreVerticalIcon className="w-5 h-5" />
                                                                </button>
                                                                {activeMenu === employee.id && (
                                                                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200 text-left">
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEdit(employee);
                                                                            }} 
                                                                            className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                                        >
                                                                            <EditIcon className="w-4 h-4 mr-3" /> Editar
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteRequest(employee);
                                                                            }} 
                                                                            className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                        >
                                                                            <TrashIcon className="w-4 h-4 mr-3" /> Eliminar
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="lg:hidden divide-y divide-gray-200">
                                    {filteredEmployees.map(employee => (
                                        <div key={employee.id} className="p-4 hover:bg-gray-50 transition-colors relative">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <EmployeeAvatar name={employee.name} size="sm" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-gray-800 truncate">{employee.name}</p>
                                                        <p className="text-sm text-gray-600 truncate">{employee.role}</p>
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 ml-2">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenu(activeMenu === employee.id ? null : employee.id);
                                                        }} 
                                                        className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
                                                    >
                                                        <MoreVerticalIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Dropdown Menu */}
                                            {activeMenu === employee.id && (
                                                <div className="absolute right-4 top-14 w-44 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(employee);
                                                        }} 
                                                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                                    >
                                                        <EditIcon className="w-4 h-4 mr-3" /> Editar
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteRequest(employee);
                                                        }} 
                                                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                                    >
                                                        <TrashIcon className="w-4 h-4 mr-3" /> Eliminar
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <div className="space-y-2 mb-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <EmailIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{employee.email}</span>
                                                </div>
                                                {employee.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <span>{employee.phone}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span>{employee.hireDate || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${employee.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                                    {employee.status === 'Active' ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 sm:py-20 flex flex-col items-center justify-center px-4">
                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6">
                                    <UsersIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                                </div>
                                <h3 className="mt-6 text-lg sm:text-xl font-bold text-gray-800">No se encontraron empleados</h3>
                                <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-md">Tu búsqueda o filtro no devolvió resultados. Intenta con otros criterios.</p>
                            </div>
                        )}
                    </div>

                    <EmployeeModal 
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSave}
                        employeeToEdit={employeeToEdit}
                    />

                    <ConfirmationModal
                        isOpen={!!employeeToDelete}
                        onClose={() => setEmployeeToDelete(null)}
                        onConfirm={confirmDelete}
                        title="Eliminar Empleado"
                    >
                        ¿Estás seguro de que deseas eliminar al empleado "{employeeToDelete?.name}"? Esta acción no se puede deshacer.
                    </ConfirmationModal>
                </>
            )}
        </div>
    );
};

export default EmployeesPage;
