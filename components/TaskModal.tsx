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

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
        {props.children}
    </select>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        rows={props.rows || 4}
        className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
    }, [task, isOpen]);

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
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            assignees: formData.assignees,
            dueDate: formData.dueDate,
        };
        onSave(taskToSave);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-800">{task ? 'Editar Tarea' : 'Crear Nueva Tarea'}</h3>
                        <button type="button" onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                           <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <label htmlFor="title" className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} required placeholder="Nombre de la tarea" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Detalles de la tarea" rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label htmlFor="priority" className="block text-xs font-medium text-gray-700 mb-1">Prioridad</label>
                                <Select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                                    <option value="Low">Baja</option>
                                    <option value="Medium">Media</option>
                                    <option value="High">Alta</option>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="dueDate" className="block text-xs font-medium text-gray-700 mb-1">Fecha límite</label>
                                <Input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="assignees" className="block text-xs font-medium text-gray-700 mb-1">Asignar a</label>
                            <Select id="assignees" name="assignees" value={formData.assignees} onChange={handleChange} multiple size={Math.min(teamMembers.length, 4)}>
                                {teamMembers.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">Mantén presionado Ctrl/Cmd para seleccionar múltiples</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                            Cancelar
                        </button>
                        <button type="submit" className="px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                            {task ? 'Guardar' : 'Crear Tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};