import React, { useState, useEffect } from 'react';
import { Event } from '../pages/DashboardPage';
import { XIcon } from './icons/XIcon';
import { TagIcon } from './icons/TagIcon';
import { ClockIcon } from './icons/ClockIcon';
import { AlignLeftIcon } from './icons/AlignLeftIcon';
import { TrashIcon } from './icons/TrashIcon';
import { GoogleCalendarIcon } from './icons/GoogleCalendarIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<Event, 'id'>, id?: string) => void;
    onDeleteRequest: (event: Event) => void;
    eventToEdit: Event | null;
    selectedDate: Date | null;
}

const EVENT_CATEGORIES: Record<Event['category'], { label: string, color: string, ring: string }> = {
  Meeting: { label: 'Meeting', color: 'bg-blue-500', ring: 'focus:ring-blue-500' },
  Deadline: { label: 'Deadline', color: 'bg-red-500', ring: 'focus:ring-red-500' },
  Shipment: { label: 'Shipment', color: 'bg-yellow-400', ring: 'focus:ring-yellow-500' },
  Personal: { label: 'Personal', color: 'bg-green-500', ring: 'focus:ring-green-500' },
  Other: { label: 'Other', color: 'bg-gray-500', ring: 'focus:ring-gray-500' },
};

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDeleteRequest, eventToEdit, selectedDate }) => {
    const initialFormData = {
        title: '',
        description: '',
        start: '',
        end: '',
        category: 'Meeting' as Event['category'],
        allDay: true,
    };
    const [formData, setFormData] = useState(initialFormData);

    const toInputDateString = (date: Date) => {
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };
    
    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                const startDate = new Date(eventToEdit.start);
                const endDate = new Date(eventToEdit.end);
                setFormData({
                    title: eventToEdit.title,
                    description: eventToEdit.description || '',
                    start: toInputDateString(startDate),
                    end: toInputDateString(endDate),
                    category: eventToEdit.category,
                    allDay: eventToEdit.allDay,
                });
            } else {
                const initialDate = selectedDate || new Date();
                setFormData({
                    ...initialFormData,
                    start: toInputDateString(initialDate),
                    end: toInputDateString(initialDate),
                });
            }
        }
    }, [eventToEdit, selectedDate, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return;
        
        let finalStart = new Date(formData.start);
        finalStart.setMinutes(finalStart.getMinutes() + finalStart.getTimezoneOffset());
        
        let finalEnd = new Date(formData.end);
        finalEnd.setMinutes(finalEnd.getMinutes() + finalEnd.getTimezoneOffset());

        if (formData.allDay) {
            finalEnd.setHours(23, 59, 59, 999);
        }
        
        if (finalEnd < finalStart) {
            finalEnd = new Date(finalStart);
             if (formData.allDay) {
                finalEnd.setHours(23, 59, 59, 999);
            }
        }

        onSave({
            title: formData.title,
            description: formData.description,
            allDay: formData.allDay,
            start: finalStart.toISOString(),
            end: finalEnd.toISOString(),
            category: formData.category,
        }, eventToEdit?.id);
    };

    const handleDelete = () => {
        if (eventToEdit) {
            onDeleteRequest(eventToEdit);
        }
    };
    
    const flatInputBase = "w-full border-0 border-b-2 border-slate-200 bg-transparent px-1 text-slate-900 focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors";
    const iconClasses = "w-5 h-5 text-slate-400 flex-shrink-0";
    const fieldWrapperClasses = "flex items-start gap-4";

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
          aria-labelledby="event-modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <header className="px-4 py-3 bg-gradient-to-br from-slate-50 via-white to-slate-50 border-b border-slate-200/80 flex-shrink-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 id="event-modal-title" className="text-lg font-bold text-slate-900 tracking-tight mb-1.5">
                      {eventToEdit ? 'Editar Evento' : 'Nuevo Evento'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {eventToEdit && (eventToEdit as any).source === 'google' && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full">
                          <GoogleCalendarIcon className="w-3 h-3 text-blue-600" />
                          <span className="text-[10px] font-semibold text-blue-700">Google</span>
                        </div>
                      )}
                      {eventToEdit && (eventToEdit as any).status === 'completed' && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full">
                          <CheckCircleIcon className="w-3 h-3 text-green-600" />
                          <span className="text-[10px] font-semibold text-green-700">Completado</span>
                        </div>
                      )}
                      {eventToEdit && (eventToEdit as any).status === 'cancelled' && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded-full">
                          <XCircleIcon className="w-3 h-3 text-red-600" />
                          <span className="text-[10px] font-semibold text-red-700">Cancelado</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={onClose} 
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors group"
                  >
                    <XIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                  </button>
                </div>
              </header>

              <div className="p-4 space-y-4 flex-grow overflow-y-auto max-h-[calc(100vh-280px)]">
                {eventToEdit && (eventToEdit as any).source === 'google' && (
                  <div className="flex items-start gap-2 p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      <GoogleCalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-900 font-medium mb-0.5">Evento sincronizado</p>
                      <p className="text-[10px] text-blue-700">Los cambios se reflejarán en Google Calendar.</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <input 
                    type="text" 
                    placeholder="Nombre del evento" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    className="w-full text-lg font-bold text-slate-900 placeholder-slate-400 bg-transparent border-0 border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors px-0 pb-2" 
                    required 
                  />
                </div>
                
                <div className="bg-slate-50/50 rounded-lg p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center flex-shrink-0 shadow-sm">
                      <ClockIcon className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Inicio</label>
                        <input 
                          name="start" 
                          type="date" 
                          value={formData.start} 
                          onChange={handleChange} 
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Fin</label>
                        <input 
                          name="end" 
                          type="date" 
                          value={formData.end} 
                          onChange={handleChange} 
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center flex-shrink-0 mt-1">
                    <AlignLeftIcon className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Descripción</label>
                    <textarea 
                      name="description" 
                      placeholder="Agrega detalles..." 
                      value={formData.description} 
                      onChange={handleChange} 
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all resize-none h-16" 
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center flex-shrink-0">
                    <TagIcon className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Categoría</label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(EVENT_CATEGORIES).map(([key, { label, color, ring }]) => (
                        <button 
                          type="button" 
                          key={key} 
                          onClick={() => setFormData(prev => ({...prev, category: key as Event['category']}))}
                          className={`px-2.5 py-1 text-xs font-semibold rounded border-2 transition-all duration-200 focus:outline-none ${formData.category === key ? `${color} text-white border-transparent shadow-sm` : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <footer className="px-4 py-3 bg-gradient-to-br from-slate-50 via-white to-slate-50 flex justify-between items-center border-t border-slate-200/80 flex-shrink-0">
                <div>
                  {eventToEdit && (
                    <button 
                      type="button" 
                      onClick={handleDelete} 
                      className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 rounded text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" /> 
                      Eliminar
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-3 py-1.5 bg-white border-2 border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all"
                  >
                    {eventToEdit ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      </>
    );
};

export default EventModal;
