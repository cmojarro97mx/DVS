import React, { useState, useEffect } from 'react';
import { Event } from '../pages/DashboardPage';
import { XIcon } from './icons/XIcon';
import { TagIcon } from './icons/TagIcon';
import { ClockIcon } from './icons/ClockIcon';
import { AlignLeftIcon } from './icons/AlignLeftIcon';
import { TrashIcon } from './icons/TrashIcon';

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
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
          aria-hidden="true"
        />
        
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <header className="p-4 flex justify-between items-center border-b border-slate-200 flex-shrink-0">
                <h3 id="event-modal-title" className="text-xl font-bold text-slate-800">{eventToEdit ? 'Edit Event' : 'Create Event'}</h3>
                <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                  <XIcon className="w-6 h-6 text-slate-600" />
                </button>
              </header>

              <div className="p-6 space-y-8 flex-grow overflow-y-auto">
                <input 
                  type="text" 
                  placeholder="Add title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  className={`${flatInputBase} pb-2 text-2xl font-bold text-slate-900 placeholder-slate-400`} 
                  required 
                />
                
                <div className={fieldWrapperClasses}>
                  <ClockIcon className={iconClasses + " mt-2.5"} />
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-medium text-slate-500">From</label>
                        <input name="start" type="date" value={formData.start} onChange={handleChange} className={`${flatInputBase} py-2 text-sm`} />
                    </div>
                     <div>
                        <label className="text-xs font-medium text-slate-500">To</label>
                        <input name="end" type="date" value={formData.end} onChange={handleChange} className={`${flatInputBase} py-2 text-sm`} />
                    </div>
                  </div>
                </div>

                <div className={fieldWrapperClasses}>
                  <AlignLeftIcon className={iconClasses + " mt-2.5"} />
                  <textarea 
                    name="description" 
                    placeholder="Add description..." 
                    value={formData.description} 
                    onChange={handleChange} 
                    className={`${flatInputBase} py-2 text-sm resize-none h-24`} 
                  ></textarea>
                </div>
                
                <div className={fieldWrapperClasses}>
                  <TagIcon className={iconClasses + " mt-2"} />
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(EVENT_CATEGORIES).map(([key, { label, color, ring }]) => (
                      <button 
                        type="button" 
                        key={key} 
                        onClick={() => setFormData(prev => ({...prev, category: key as Event['category']}))}
                        className={`px-3 py-1 text-sm font-medium rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${ring} ${formData.category === key ? `${color} text-white border-transparent shadow-sm` : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <footer className="px-6 py-4 bg-slate-50 flex justify-between items-center rounded-b-lg border-t border-slate-200 flex-shrink-0">
                <div>
                  {eventToEdit && (
                    <button type="button" onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
                      <TrashIcon className="w-5 h-5" /> Delete
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      </>
    );
};

export default EventModal;
