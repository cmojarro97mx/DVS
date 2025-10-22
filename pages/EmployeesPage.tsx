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
const EmployeeAvatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || name[0]?.toUpperCase() || 'E';
  const colorClass = getColorForString(name);
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorClass}`} title={name}>
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

    const baseInputClasses = "block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-800">{employeeToEdit ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}</h3>
                        <button type="button" onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                           <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className={labelClasses}>Nombre Completo *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className={baseInputClasses} required />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Correo Electrónico *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className={baseInputClasses} required />
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
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
                        <button type="submit" className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">{employeeToEdit ? 'Guardar Cambios' : 'Agregar Empleado'}</button>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                            <UsersIcon className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
                            <p className="text-sm text-gray-500">ID: EMP-{new Date().getFullYear()}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total Employees</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{teamMembers.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Active</p>
                        <p className="text-xl font-bold text-green-600 mt-1">
                            {teamMembers.filter(e => e.status === 'Active').length}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Inactive</p>
                        <p className="text-xl font-bold text-gray-600 mt-1">
                            {teamMembers.filter(e => e.status === 'Inactive').length}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Departments</p>
                        <p className="text-xl font-bold text-blue-600 mt-1">
                            {new Set(teamMembers.map(e => e.role)).size}
                        </p>
                    </div>
                </div>

                {/* Navigation Tabs (Only Overview is kept) */}
                <div className="flex gap-6 mt-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'overview'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <UsersIcon className="w-5 h-5" />
                        Overview
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    {/* Controls Bar */}
                    <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name, role or email..." 
                            className="pl-10 pr-4 py-2 w-full md:w-64 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-red-500 focus:border-red-500"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                        <select 
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="pl-10 pr-4 py-2 appearance-none border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                <button 
                    onClick={handleAddNew} 
                    className="w-full md:w-auto flex-shrink-0 flex items-center justify-center bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Employee
                </button>
            </div>


            {/* Employees Table */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {filteredEmployees.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white border-b border-slate-300">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Hire Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredEmployees.map(employee => (
                                    <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <EmployeeAvatar name={employee.name} />
                                                <div>
                                                    <p className="font-bold text-slate-800">{employee.name}</p>
                                                    <p className="text-sm text-slate-500">{employee.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle font-medium text-slate-700">{employee.role}</td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm">{employee.hireDate || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle text-center">
                                            <div className="relative inline-block" ref={menuRef}>
                                                <button 
                                                    onClick={() => setActiveMenu(activeMenu === employee.id ? null : employee.id)} 
                                                    className="p-2 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                                                >
                                                    <MoreVerticalIcon className="w-5 h-5" />
                                                </button>
                                                {activeMenu === employee.id && (
                                                    <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-xl py-1 z-10 border border-slate-200 text-left">
                                                        <button 
                                                            onClick={() => handleEdit(employee)} 
                                                            className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                                        >
                                                            <EditIcon className="w-4 h-4 mr-3 text-slate-500" /> Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteRequest(employee)} 
                                                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                        >
                                                            <TrashIcon className="w-4 h-4 mr-3" /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-20 flex flex-col items-center justify-center">
                        <div className="bg-slate-100 rounded-full p-5">
                            <UsersIcon className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="mt-6 text-lg font-semibold text-slate-800">No Employees Found</h3>
                        <p className="mt-1 text-sm text-slate-500">Your search or filter returned no results.</p>
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
                title="Delete Employee"
            >
                Are you sure you want to delete employee "{employeeToDelete?.name}"? This action cannot be undone.
            </ConfirmationModal>
                </>
            )}

            {/* Removed Tasks and Performance Tabs */}
        </div>
    );
};

export default EmployeesPage;