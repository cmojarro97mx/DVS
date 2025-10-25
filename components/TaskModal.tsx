import React, { useState, useEffect } from 'react';
import { Task } from '../pages/DashboardPage';
import { TeamMember } from '../pages/DashboardPage';
import { XIcon } from './icons/XIcon';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'operationId'>) => void;
    task: Task | null;
    teamMembers: TeamMember[];
}

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

    const priorityOptions = [
        { value: 'Low', label: 'Baja', color: 'bg-green-100 text-green-700' },
        { value: 'Medium', label: 'Media', color: 'bg-yellow-100 text-yellow-700' },
        { value: 'High', label: 'Alta', color: 'bg-red-100 text-red-700' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    {/* Header Compacto */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">
                            {task ? '✏️ Editar Tarea' : '➕ Nueva Tarea'}
                        </h2>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body Compacto */}
                    <div className="px-5 py-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                        {/* Título */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Título <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                name="title" 
                                value={formData.title} 
                                onChange={handleChange} 
                                required 
                                placeholder="¿Qué hay que hacer?" 
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Descripción
                            </label>
                            <textarea 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                placeholder="Detalles adicionales..." 
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                            />
                        </div>

                        {/* Prioridad y Fecha en Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Prioridad
                                </label>
                                <select 
                                    name="priority" 
                                    value={formData.priority} 
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                >
                                    <option value="Low">🟢 Baja</option>
                                    <option value="Medium">🟡 Media</option>
                                    <option value="High">🔴 Alta</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Fecha límite
                                </label>
                                <input 
                                    type="date" 
                                    name="dueDate" 
                                    value={formData.dueDate} 
                                    onChange={handleChange} 
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Asignar personas */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Asignar a
                            </label>
                            <select 
                                name="assignees" 
                                value={formData.assignees} 
                                onChange={handleChange} 
                                multiple 
                                size={Math.min(teamMembers.length, 4)}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            >
                                {teamMembers.map(member => (
                                    <option key={member.id} value={member.id} className="py-1.5 hover:bg-red-50">
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Ctrl/Cmd + clic para seleccionar varios
                            </p>
                        </div>

                        {/* Personas asignadas - Versión compacta */}
                        {formData.assignees.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Asignadas ({formData.assignees.length}):</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {formData.assignees.map(assigneeId => {
                                        const member = teamMembers.find(m => m.id === assigneeId);
                                        return member ? (
                                            <div key={assigneeId} className="inline-flex items-center gap-1.5 bg-white px-2 py-1 rounded-md text-xs border border-gray-200">
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-gray-700 font-medium">{member.name}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer con botones prominentes */}
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 bg-white border border-gray-300 rounded-lg transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {task ? 'Guardar' : 'Crear Tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
