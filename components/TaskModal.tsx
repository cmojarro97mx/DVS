import React, { useState, useEffect } from 'react';
import { Task } from '../pages/DashboardPage';
import { TeamMember } from '../pages/DashboardPage';
import { XIcon } from './icons/XIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { TagIcon } from './icons/TagIcon';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'operationId'>) => void;
    task: Task | null;
    teamMembers: TeamMember[];
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
    />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
    >
        {props.children}
    </select>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        rows={props.rows || 4}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all resize-none"
    />
);

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, teamMembers }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium' as 'Low' | 'Medium' | 'High',
        assignees: [] as string[],
        dueDate: '',
    });
    
    useEffect(() => {
        if (isOpen) {
            if (task) {
                setFormData({
                    title: task.title,
                    description: task.description || '',
                    priority: task.priority,
                    assignees: task.assignees || [],
                    dueDate: task.dueDate || '',
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    priority: 'Medium',
                    assignees: [],
                    dueDate: '',
                });
            }
        }
    }, [task, isOpen, teamMembers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'assignees') {
            const selectedOptions = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
            setFormData(prev => ({ ...prev, assignees: selectedOptions }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            alert('El título es requerido.');
            return;
        }
        
        const taskToSave: Omit<Task, 'operationId'> = {
            id: task ? task.id : `task-${new Date().getTime()}`,
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            priority: formData.priority,
            assignees: formData.assignees.length > 0 ? formData.assignees : undefined,
            dueDate: formData.dueDate || undefined,
        };
        onSave(taskToSave);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {task ? 'Editar tarea' : 'Nueva tarea'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {task ? 'Actualiza la información de la tarea' : 'Completa los detalles de la nueva tarea'}
                                </p>
                            </div>
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                        {/* Título */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Título <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                id="title" 
                                name="title" 
                                value={formData.title} 
                                onChange={handleChange} 
                                required 
                                placeholder="Ej: Revisar documentos de importación" 
                            />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <Textarea 
                                id="description" 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                placeholder="Describe los detalles de la tarea..." 
                                rows={3} 
                            />
                        </div>

                        {/* Prioridad y Fecha */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                                    Prioridad
                                </label>
                                <Select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                                    <option value="Low">Baja</option>
                                    <option value="Medium">Media</option>
                                    <option value="High">Alta</option>
                                </Select>
                            </div>

                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha límite
                                </label>
                                <Input 
                                    type="date" 
                                    id="dueDate" 
                                    name="dueDate" 
                                    value={formData.dueDate} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>

                        {/* Asignar personas */}
                        <div>
                            <label htmlFor="assignees" className="block text-sm font-medium text-gray-700 mb-2">
                                Asignar a
                            </label>
                            <Select 
                                id="assignees" 
                                name="assignees" 
                                value={formData.assignees} 
                                onChange={handleChange} 
                                multiple 
                                size={Math.min(teamMembers.length, 4)}
                            >
                                {teamMembers.map(member => (
                                    <option key={member.id} value={member.id} className="py-2">
                                        {member.name}
                                    </option>
                                ))}
                            </Select>
                            <p className="text-xs text-gray-500 mt-1.5">
                                Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar múltiples personas
                            </p>
                        </div>

                        {/* Personas asignadas */}
                        {formData.assignees.length > 0 && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-700 mb-3">Personas asignadas:</p>
                                <div className="flex flex-wrap gap-2">
                                    {formData.assignees.map(assigneeId => {
                                        const member = teamMembers.find(m => m.id === assigneeId);
                                        return member ? (
                                            <div key={assigneeId} className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg text-sm border border-gray-200">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-semibold">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-gray-700">{member.name}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-white border border-gray-300 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                        >
                            {task ? 'Guardar cambios' : 'Crear tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
