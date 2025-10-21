import React, { useState, useEffect } from 'react';
import { TeamMember } from '../pages/DashboardPage';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';

interface EmployeePanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: Omit<TeamMember, 'id'>) => void;
    employeeToEdit: TeamMember | null;
    onDeleteRequest: (employee: TeamMember) => void;
}

export const EmployeePanel: React.FC<EmployeePanelProps> = ({ isOpen, onClose, onSave, employeeToEdit, onDeleteRequest }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', role: '', hireDate: '', status: 'Active' as 'Active' | 'Inactive',
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
                });
            } else {
                setFormData({ name: '', email: '', phone: '', role: '', hireDate: '', status: 'Active' });
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

    const handleDelete = () => {
        if (employeeToEdit) {
            onDeleteRequest(employeeToEdit);
            onClose();
        }
    };

    const baseInputClasses = "block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    const labelClasses = "text-sm font-medium text-gray-700";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40" onClick={onClose}>
            <div
                className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">{employeeToEdit ? 'Edit Employee' : 'Add New Employee'}</h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XIcon className="w-6 h-6 text-gray-600" /></button>
                    </div>
                    <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Full Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={baseInputClasses} required /></div>
                            <div><label className={labelClasses}>Role / Position</label><input type="text" name="role" value={formData.role} onChange={handleChange} className={baseInputClasses} required /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={baseInputClasses} required /></div>
                            <div><label className={labelClasses}>Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={baseInputClasses} /></div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Date of Hire</label><input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className={baseInputClasses} /></div>
                            <div><label className={labelClasses}>Status</label><select name="status" value={formData.status} onChange={handleChange} className={baseInputClasses}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 border-t flex justify-between items-center gap-3">
                        <div>
                            {employeeToEdit && (
                                <button type="button" onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-2">
                                    <TrashIcon className="w-5 h-5"/> Delete
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                            <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Employee</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};