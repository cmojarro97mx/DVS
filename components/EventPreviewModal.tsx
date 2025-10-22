
import React from 'react';
import { Event } from '../pages/DashboardPage';
import { XIcon } from './icons/XIcon';
import { TagIcon } from './icons/TagIcon';
import { ClockIcon } from './icons/ClockIcon';
import { AlignLeftIcon } from './icons/AlignLeftIcon';
import { GoogleCalendarIcon } from './icons/GoogleCalendarIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface EventPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    event: Event & { source?: string; status?: string } | null;
}

const EVENT_CATEGORIES: Record<Event['category'], { label: string, color: string }> = {
  Meeting: { label: 'Reunión', color: 'bg-blue-500' },
  Deadline: { label: 'Fecha límite', color: 'bg-red-500' },
  Shipment: { label: 'Envío', color: 'bg-yellow-400' },
  Personal: { label: 'Personal', color: 'bg-green-500' },
  Other: { label: 'Otro', color: 'bg-gray-500' },
};

const EventPreviewModal: React.FC<EventPreviewModalProps> = ({ isOpen, onClose, onEdit, onDelete, event }) => {
    if (!event) return null;

    const formatEventDate = (start: string, end: string, allDay: boolean) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (allDay) {
            if (startDate.toDateString() === endDate.toDateString()) {
                return startDate.toLocaleDateString('es-ES', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            return `${startDate.toLocaleDateString('es-ES', { 
                month: 'short',
                day: 'numeric'
            })} - ${endDate.toLocaleDateString('es-ES', { 
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })}`;
        }
        
        return `${startDate.toLocaleDateString('es-ES', { 
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })}, ${startDate.toLocaleTimeString('es-ES', { 
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })} - ${endDate.toLocaleTimeString('es-ES', { 
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}`;
    };

    const getStatusBadge = () => {
        if (event.status === 'completed') {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">Completado</span>
                </div>
            );
        }
        if (event.status === 'cancelled') {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                    <XCircleIcon className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-700">Cancelado</span>
                </div>
            );
        }
        if (event.status === 'deleted') {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <TrashIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700">Eliminado</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-blue-700">Activo</span>
            </div>
        );
    };

    const categoryInfo = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES['Other'];
    const isGoogleEvent = event.source === 'google';
    const canEdit = event.status !== 'deleted';

    return (
        <>
            <div 
                className={`fixed inset-0 bg-slate-900/70 backdrop-blur-md z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                role="dialog"
                aria-modal="true"
            >
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                    <header className="px-5 py-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 border-b border-slate-200">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h2>
                                <div className="flex flex-wrap items-center gap-2">
                                    {getStatusBadge()}
                                    {isGoogleEvent && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                                            <GoogleCalendarIcon className="w-4 h-4 text-blue-600" />
                                            <span className="text-xs font-semibold text-blue-700">Google Calendar</span>
                                        </div>
                                    )}
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 ${categoryInfo.color} text-white rounded-lg`}>
                                        <TagIcon className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{categoryInfo.label}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors group ml-2"
                            >
                                <XIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                            </button>
                        </div>
                    </header>

                    <div className="p-5 space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-lg">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                <ClockIcon className="w-4 h-4 text-slate-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha y hora</p>
                                <p className="text-sm text-slate-900 font-medium">{formatEventDate(event.start, event.end, event.allDay)}</p>
                            </div>
                        </div>

                        {event.description && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <AlignLeftIcon className="w-4 h-4 text-slate-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Descripción</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{event.description}</p>
                                </div>
                            </div>
                        )}

                        {isGoogleEvent && (
                            <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
                                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                    <RefreshIcon className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-blue-900 font-medium mb-0.5">Sincronizado</p>
                                    <p className="text-[10px] text-blue-700">Este evento está vinculado con Google Calendar.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <footer className="px-5 py-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 flex justify-between items-center border-t border-slate-200">
                        <div>
                            {canEdit && (
                                <button 
                                    type="button" 
                                    onClick={onDelete} 
                                    className="flex items-center gap-2 px-3 py-2 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" /> 
                                    Eliminar
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                            >
                                Cerrar
                            </button>
                            {canEdit && (
                                <button 
                                    type="button" 
                                    onClick={onEdit}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    Editar
                                </button>
                            )}
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default EventPreviewModal;
