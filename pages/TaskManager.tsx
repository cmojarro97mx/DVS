import React, { useState, useEffect } from 'react';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TaskModal } from '../components/TaskModal';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { TeamMember, Task, Column } from './DashboardPage';
import { tasksService } from '../src/services/tasksService';
import { ExclamationCircleIcon } from '../components/icons/ExclamationCircleIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';

const getPriorityConfig = (priority: 'Low' | 'Medium' | 'High') => {
  switch (priority) {
    case 'High': 
      return { 
        color: 'bg-red-100 text-red-700 border-red-200', 
        dot: 'bg-red-500',
        icon: ExclamationCircleIcon,
        label: 'Alta'
      };
    case 'Medium': 
      return { 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
        dot: 'bg-yellow-500',
        icon: ClockIcon,
        label: 'Media'
      };
    case 'Low': 
      return { 
        color: 'bg-green-100 text-green-700 border-green-200', 
        dot: 'bg-green-500',
        icon: CheckCircleIcon,
        label: 'Baja'
      };
    default: 
      return { 
        color: 'bg-gray-100 text-gray-700 border-gray-200', 
        dot: 'bg-gray-400',
        icon: ClockIcon,
        label: 'Media'
      };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const isOverdue = date < now;
  const diffTime = Math.abs(date.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const formatted = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  
  if (isOverdue) {
    return { text: formatted, overdue: true, label: 'Vencida' };
  } else if (diffDays === 0) {
    return { text: formatted, overdue: false, label: 'Hoy' };
  } else if (diffDays === 1) {
    return { text: formatted, overdue: false, label: 'Mañana' };
  } else if (diffDays <= 3) {
    return { text: formatted, overdue: false, label: `${diffDays} días` };
  }
  
  return { text: formatted, overdue: false, label: null };
};

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging, onEdit, onDelete, onDragStart, onDragEnd }) => {
  const priorityConfig = getPriorityConfig(task.priority);
  const PriorityIcon = priorityConfig.icon;
  const dateInfo = task.dueDate ? formatDate(task.dueDate) : null;

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      className={`group bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:shadow-sm hover:border-gray-300'}`}
    >
      <div className="p-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h4 className="font-medium text-gray-900 text-sm flex-1 leading-tight">{task.title}</h4>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button 
              onClick={() => onEdit(task)} 
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Editar"
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => onDelete(task.id)} 
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Eliminar"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${priorityConfig.color}`}>
            <PriorityIcon className="w-3 h-3" />
            {priorityConfig.label}
          </span>

          {dateInfo && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${dateInfo.overdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              <CalendarIcon className="w-3 h-3" />
              {dateInfo.label || dateInfo.text}
            </span>
          )}

          {(task.createdBy === 'automation' || task.lastModifiedBy === 'automation') && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200"
              title={task.createdBy === 'automation' ? 'Creada automáticamente por IA' : 'Modificada automáticamente por IA'}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z" />
                <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
              </svg>
              {task.createdBy === 'automation' ? 'Automática' : 'Auto-actualizada'}
            </span>
          )}
        </div>

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center gap-2 pt-2.5 border-t border-gray-100">
            <div className="flex -space-x-1.5">
              {task.assignees.slice(0, 3).map((assignee, idx) => (
                <div
                  key={idx}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                  title={assignee}
                >
                  {assignee.charAt(0).toUpperCase()}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-semibold border-2 border-white">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {task.assignees.length === 1 ? task.assignees[0] : `${task.assignees.length} personas`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

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
  
  const assigneesToShow = availableAssignees.length > 0 ? availableAssignees : teamMembers;

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    // Convert assignee names back to IDs for editing
    const assigneeIds = task.assignees?.map(assigneeName => {
      const member = teamMembers.find(m => m.name === assigneeName);
      return member ? member.id : null;
    }).filter(Boolean) as string[] || [];
    
    setEditingTask({
      ...task,
      assignees: assigneeIds
    });
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      try {
        await tasksService.delete(taskId);
        onDeleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error al eliminar la tarea. Por favor, intenta nuevamente.');
      }
    }
  };

  const handleSave = async (task: Omit<Task, 'operationId'>) => {
    try {
      let savedTask;
      if (editingTask) {
        const updateData: any = {
          title: task.title,
          priority: task.priority,
        };
        
        if (task.description) updateData.description = task.description;
        if (task.dueDate) updateData.dueDate = task.dueDate;
        if (task.assignees && task.assignees.length > 0) updateData.assignees = task.assignees;
        
        savedTask = await tasksService.update(editingTask.id, updateData);
      } else {
        const createData: any = {
          title: task.title,
          priority: task.priority || 'Medium',
          operationId: operationId,
          status: 'To Do', // Default status for new tasks
        };
        
        if (task.description) createData.description = task.description;
        if (task.dueDate) createData.dueDate = task.dueDate;
        if (task.assignees && task.assignees.length > 0) createData.assignees = task.assignees;
        
        savedTask = await tasksService.create(createData);
      }
      
      // Transform assignees from backend format to frontend format
      const transformedAssignees = savedTask.assignees 
        ? savedTask.assignees.map((a: any) => a.user?.name || 'Unknown')
        : [];
      
      const completeTask: Task = {
        ...savedTask,
        operationId: operationId,
        assignees: transformedAssignees
      };
      onSaveTask(completeTask);
      handleCloseModal();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error al guardar la tarea. Por favor, intenta nuevamente.');
    }
  };

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
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragEnter = (columnId: string) => {
    if (draggedTaskId) setDragOverColumnId(columnId);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, destColumnId: string) => {
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

      // Map column ID to status
      const columnIdToStatus: Record<string, string> = {
        'column-1': 'To Do',
        'column-2': 'In Progress',
        'column-3': 'Done'
      };
      
      const newStatus = columnIdToStatus[destColumnId] || columns[destColumnId].title;

      try {
        await tasksService.update(taskId, { status: newStatus });
      } catch (error) {
        console.error('Error updating task status:', error);
        onUpdateColumns(columns);
        alert('Error al mover la tarea. Por favor, intenta nuevamente.');
      }
    }
    
    setDragOverColumnId(null);
    setDraggedTaskId(null);
  };
  
  const safeColumns = columns || {};
  const safeTasks = tasks || {};

  const getColumnColor = (columnTitle: string) => {
    const title = columnTitle.toLowerCase();
    if (title.includes('do') || title.includes('hacer') || title.includes('pendiente')) {
      return 'from-slate-500 to-slate-600';
    } else if (title.includes('progress') || title.includes('proceso') || title.includes('doing')) {
      return 'from-blue-500 to-blue-600';
    } else if (title.includes('done') || title.includes('completado') || title.includes('hecho')) {
      return 'from-green-500 to-green-600';
    }
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-5 bg-white p-4 rounded-lg border border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tablero de tareas</h3>
          <p className="text-sm text-gray-500 mt-0.5">Organiza y gestiona las tareas</p>
        </div>
        <button 
          onClick={handleAddTask} 
          className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-1.5" />
          Nueva tarea
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {columnOrder.map(columnId => {
          const column = safeColumns[columnId];
          if (!column) return null;
          
          const columnTasks = column.taskIds.map(taskId => safeTasks[taskId]).filter(Boolean);
          const isDragOver = dragOverColumnId === column.id;

          const columnStyles = {
            'column-1': { bg: 'bg-gray-50', border: 'border-gray-200', header: 'bg-gray-100', text: 'text-gray-700' },
            'column-2': { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100', text: 'text-blue-700' },
            'column-3': { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100', text: 'text-green-700' }
          };

          const style = columnStyles[columnId] || columnStyles['column-1'];

          return (
            <div 
              key={column.id} 
              className="flex flex-col min-h-0 bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Column Header */}
              <div className={`${style.header} px-4 py-3 border-b ${style.border}`}>
                <div className="flex items-center justify-between">
                  <h4 className={`font-semibold text-sm ${style.text}`}>
                    {column.title}
                  </h4>
                  <span className={`${style.bg} ${style.text} text-xs font-medium px-2 py-0.5 rounded-md border ${style.border}`}>
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Column Body */}
              <div 
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`flex-1 p-3 ${style.bg} transition-all duration-200 min-h-[400px] overflow-hidden ${
                  isDragOver 
                    ? 'ring-2 ring-red-500 ring-inset' 
                    : ''
                }`}
              >
                <div className="h-full overflow-y-auto space-y-2.5">
                  {columnTasks.length === 0 && !isDragOver && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                      <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-xs font-medium">No hay tareas</p>
                    </div>
                  )}
                  
                  {isDragOver && columnTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-red-600">
                      <svg className="w-10 h-10 mb-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-xs font-semibold">Suelta aquí</p>
                    </div>
                  )}

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
            </div>
          );
        })}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        task={editingTask}
        teamMembers={assigneesToShow}
      />
    </div>
  );
};

export default TaskManager;
