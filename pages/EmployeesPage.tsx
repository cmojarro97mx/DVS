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

// Employee Modal Component
const EmployeeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: any) => void;
    employeeToEdit: TeamMember | null;
}> = ({ isOpen, onClose, onSave, employeeToEdit }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', role: '', hireDate: '', status: 'Active' as 'Active' | 'Inactive', password: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (employeeToEdit) {
                setFormData({
                    name: employeeToEdit.name,
                    email: employeeToEdit.email,
                    phone: employeeToEdit.phone || '',
                    role: employeeToEdit.role,
                    hireDate: employeeToEdit.hireDate || '',
                    status: employeeToEdit.status,
                    password: '',
                });
            } else {
                setFormData({ name: '', email: '', phone: '', role: '', hireDate: new Date().toISOString().split('T')[0], status: 'Active', password: '' });
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
                        <h3 className="text-xl font-semibold text-gray-800">{employeeToEdit ? 'Edit Employee' : 'Add New Employee'}</h3>
                        <button type="button" onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                           <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={baseInputClasses} required /></div>
                            <div><label className={labelClasses}>Role / Position *</label><input type="text" name="role" value={formData.role} onChange={handleChange} className={baseInputClasses} required /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={baseInputClasses} required /></div>
                            <div><label className={labelClasses}>Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={baseInputClasses} /></div>
                        </div>
                        {!employeeToEdit && (
                            <div>
                                <label className={labelClasses}>Password *</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} className={baseInputClasses} required={!employeeToEdit} placeholder="Initial password for new employee" />
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Hire Date</label><input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className={baseInputClasses} /></div>
                            <div><label className={labelClasses}>Status</label><select name="status" value={formData.status} onChange={handleChange} className={baseInputClasses}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">{employeeToEdit ? 'Save Changes' : 'Add Employee'}</button>
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
    
    const handleSave = async (employeeData: Omit<TeamMember, 'id'>) => {
        try {
            if (employeeToEdit) {
                await employeesService.update(employeeToEdit.id, employeeData as any);
            } else {
                await employeesService.create(employeeData as any);
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
    
    return (
        <div className="animate-fade-in space-y-6">
            <Banner
                title="Employee Management"
                description="Administer your team, manage roles, and track employee information."
                icon={UsersIcon}
            />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        {['All', 'Active', 'Inactive'].map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${statusFilter === status ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>
                                {status}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-grow md:flex-grow-0">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search employees..." className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
                <button onClick={handleAddNew} className="w-full md:w-auto flex-shrink-0 flex items-center justify-center bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Employee
                </button>
            </div>


            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {filteredEmployees.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Employee</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Hire Date</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredEmployees.map(employee => (
                                    <tr key={employee.id} className="hover:bg-slate-50/70">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <EmployeeAvatar name={employee.name} />
                                                <div>
                                                    <p className="font-bold text-slate-800">{employee.name}</p>
                                                    <p className="text-slate-500">{employee.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-slate-700">{employee.role}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{employee.status}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                <span>{employee.hireDate || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="relative inline-block" ref={menuRef}>
                                                <button onClick={() => setActiveMenu(activeMenu === employee.id ? null : employee.id)} className="p-2 text-slate-500 rounded-full hover:bg-slate-200">
                                                    <MoreVerticalIcon className="w-5 h-5" />
                                                </button>
                                                {activeMenu === employee.id && (
                                                    <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-xl py-1 z-10 border border-slate-200 text-left">
                                                        <button onClick={() => handleEdit(employee)} className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                                            <EditIcon className="w-4 h-4 mr-3 text-slate-500" /> Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteRequest(employee)} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
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
        </div>
    );
};

export default EmployeesPage;