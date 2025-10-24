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
        className="block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
    />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className="block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
    >
        {props.children}
    </select>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        rows={props.rows || 4}
        className="block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
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
                const defaultAssignee = teamMembers.length > 0 ? [teamMembers[0].id] : [];
                setFormData({
                    title: '',
                    description: '',
                    priority: 'Medium',
                    assignees: defaultAssignee,
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

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'High': return ExclamationCircleIcon;
            case 'Medium': return ClockIcon;
            case 'Low': return CheckCircleIcon;
            default: return ClockIcon;
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative transform transition-all scale-100 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl relative">
                        <h3 className="text-2xl font-bold text-white">
                            {task ? 'Editar Tarea' : 'Nueva Tarea'}
                        </h3>
                        <p className="text-red-100 text-sm mt-1">
                            {task ? 'Actualiza los detalles de tu tarea' : 'Crea una nueva tarea para tu operación'}
                        </p>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="absolute top-5 right-5 text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                           <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-5 max-h-[calc(100vh-300px)] overflow-y-auto">
                        <div>
                            <label htmlFor="title" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-500" />
                                Título <span className="text-red-500 ml-1">*</span>
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

                        <div>
                            <label htmlFor="description" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-500" />
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="priority" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                    <TagIcon className="w-5 h-5 mr-2 text-gray-500" />
                                    Prioridad
                                </label>
                                <div className="relative">
                                    <Select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                                        <option value="Low">🟢 Baja</option>
                                        <option value="Medium">🟡 Media</option>
                                        <option value="High">🔴 Alta</option>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="dueDate" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                    <CalendarIcon className="w-5 h-5 mr-2 text-gray-500" />
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

                        <div>
                            <label htmlFor="assignees" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                <UserGroupIcon className="w-5 h-5 mr-2 text-gray-500" />
                                Asignar a
                            </label>
                            <Select 
                                id="assignees" 
                                name="assignees" 
                                value={formData.assignees} 
                                onChange={handleChange} 
                                multiple 
                                size={Math.min(teamMembers.length, 5)}
                                className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                            >
                                {teamMembers.map(member => (
                                    <option key={member.id} value={member.id} className="py-2">
                                        {member.name}
                                    </option>
                                ))}
                            </Select>
                            <p className="text-xs text-gray-500 mt-2 flex items-start">
                                <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar múltiples personas
                            </p>
                        </div>

                        {formData.assignees.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-900 mb-2">Personas asignadas:</p>
                                <div className="flex flex-wrap gap-2">
                                    {formData.assignees.map(assigneeId => {
                                        const member = teamMembers.find(m => m.id === assigneeId);
                                        return member ? (
                                            <div key={assigneeId} className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 border border-blue-300">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                {member.name}
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-gray-200">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-sm font-semibold text-white hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg"
                        >
                            {task ? '✓ Guardar Cambios' : '+ Crear Tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
