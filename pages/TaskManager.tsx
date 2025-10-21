import React, { useState } from 'react';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TaskModal } from '../components/TaskModal';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { TeamMember, Task, Column } from './DashboardPage';


const getPriorityColor = (priority: 'Low' | 'Medium' | 'High') => {
  switch (priority) {
    case 'High': return 'bg-red-500';
    case 'Medium': return 'bg-yellow-500';
    case 'Low': return 'bg-green-500';
    default: return 'bg-gray-400';
  }
};

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging, onEdit, onDelete, onDragStart, onDragEnd }) => (
    <div 
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        onDragEnd={onDragEnd}
        className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-3 transition-all duration-200 cursor-grab ${isDragging ? 'opacity-50 scale-105 shadow-lg cursor-grabbing' : 'opacity-100'}`}
    >
        <div className="flex justify-between items-start">
            <h4 className="font-semibold text-gray-800 text-sm">{task.title}</h4>
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} mt-1 flex-shrink-0`} title={`Priority: ${task.priority}`}></div>
        </div>
        {task.description && <p className="text-xs text-gray-500 mt-2">{task.description}</p>}
        <div className="flex justify-between items-end mt-4">
            <div className="flex items-center space-x-2 flex-wrap">
                {task.assignees && task.assignees.length > 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                        <UserCircleIcon className="w-4 h-4 mr-1" />
                        {task.assignees.join(', ')}
                    </div>
                )}
                {task.dueDate && (
                     <div className="flex items-center text-xs text-gray-500">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {task.dueDate}
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-1">
                <button onClick={() => onEdit(task)} className="p-1 text-gray-400 hover:text-blue-600 rounded-full"><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => onDelete(task.id)} className="p-1 text-gray-400 hover:text-red-600 rounded-full"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
    </div>
);

interface TaskManagerProps {
    operationId: string;
    teamMembers: TeamMember[];
    operationAssignees: string[];
    tasks: Record<string, Task>;
    columns: Record<string, Column>;
    columnOrder: string[];
    onSaveTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onUpdateColumns: (newColumns: Record<string, Column>) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ 
    operationId, teamMembers, operationAssignees, tasks, columns, columnOrder, 
    onSaveTask, onDeleteTask, onUpdateColumns 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

    const availableAssignees = teamMembers.filter(member => 
        operationAssignees.includes(member.name)
    );

    const handleAddTask = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleDelete = (taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            onDeleteTask(taskId);
        }
    };

    const handleSave = (task: Omit<Task, 'operationId'>) => {
        const completeTask: Task = {
            ...task,
            operationId: operationId
        };
        onSaveTask(completeTask);
        handleCloseModal();
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setDraggedTaskId(taskId), 0);
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDragOverColumnId(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };
    
    const handleDragEnter = (columnId: string) => {
        if (draggedTaskId) setDragOverColumnId(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumnId(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, destColumnId: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        let sourceColumnId: string | null = null;
        for (const colId in columns) {
            if (columns[colId].taskIds.includes(taskId)) {
                sourceColumnId = colId;
                break;
            }
        }

        if (sourceColumnId && sourceColumnId !== destColumnId) {
            const newColumns = { ...columns };
            const sourceTaskIds = newColumns[sourceColumnId].taskIds.filter(id => id !== taskId);
            newColumns[sourceColumnId] = { ...newColumns[sourceColumnId], taskIds: sourceTaskIds };
            
            const destTaskIds = [...newColumns[destColumnId].taskIds, taskId];
            newColumns[destColumnId] = { ...newColumns[destColumnId], taskIds: destTaskIds };
            
            onUpdateColumns(newColumns);
        }
        
        setDragOverColumnId(null);
        setDraggedTaskId(null);
    };
    
    const safeColumns = columns || {};
    const safeTasks = tasks || {};

    return (
        <div className="flex flex-col min-h-[70vh]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Task Board</h3>
                <button onClick={handleAddTask} className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-1" />
                    Add Task
                </button>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
                {columnOrder.map(columnId => {
                    const column = safeColumns[columnId];
                    if (!column) return null;
                    
                    const columnTasks = column.taskIds.map(taskId => safeTasks[taskId]).filter(Boolean);
                    const isDragOver = dragOverColumnId === column.id;
                    return (
                        <div 
                            key={column.id} 
                            onDragOver={handleDragOver}
                            onDragEnter={() => handleDragEnter(column.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.id)}
                            className={`rounded-xl p-4 flex flex-col transition-all duration-300 ease-in-out border-2 border-dashed ${isDragOver ? 'bg-blue-50 border-blue-400 scale-[1.01]' : 'bg-gray-100 border-transparent'}`}
                        >
                            <h4 className="font-semibold text-gray-700 mb-4 px-2">{column.title} ({columnTasks.length})</h4>
                            <div className="flex-grow overflow-y-auto pr-1 space-y-3">
                                {columnTasks.map(task => (
                                    <TaskCard 
                                      key={task.id} 
                                      task={task}
                                      isDragging={draggedTaskId === task.id}
                                      onEdit={handleEditTask}
                                      onDelete={handleDelete}
                                      onDragStart={handleDragStart}
                                      onDragEnd={handleDragEnd}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                task={editingTask}
                teamMembers={availableAssignees}
            />
        </div>
    );
};

export default TaskManager;