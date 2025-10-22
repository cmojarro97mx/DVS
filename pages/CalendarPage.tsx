import React, { useState, useEffect, useMemo } from 'react';
import { View, EmailAccount } from './DashboardPage';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import EventModal from '../components/EventModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CalendarDaysIcon } from '../components/icons/CalendarDaysIcon';
import { Banner } from '../components/Banner';
import { PackageIcon } from '../components/icons/PackageIcon';
import { GmailIcon } from '../components/icons/GmailIcon';
import { GSuiteIcon } from '../components/icons/GSuiteIcon';
import { MailIcon } from '../components/icons/MailIcon';
import { LinkIcon } from '../components/icons/LinkIcon';
import { GoogleCalendarIcon } from '../components/icons/GoogleCalendarIcon';
import { calendarService, Event as BackendEvent } from '../src/services/calendarService';
import { Event as UIEvent } from './DashboardPage';

const CATEGORY_TO_COLOR: Record<UIEvent['category'], string> = {
  'Meeting': 'blue',
  'Deadline': 'red',
  'Shipment': 'yellow',
  'Personal': 'green',
  'Other': 'gray',
};

const COLOR_TO_CATEGORY: Record<string, UIEvent['category']> = {
  'blue': 'Meeting',
  'red': 'Deadline',
  'yellow': 'Shipment',
  'green': 'Personal',
  'gray': 'Other',
};

const adaptBackendEventToUI = (backendEvent: BackendEvent): UIEvent & { source?: 'manual' | 'google' } => {
  const category = backendEvent.color && COLOR_TO_CATEGORY[backendEvent.color] 
    ? COLOR_TO_CATEGORY[backendEvent.color] 
    : 'Meeting';
  
  return {
    id: backendEvent.id,
    title: backendEvent.title,
    description: backendEvent.description || '',
    start: backendEvent.startDate,
    end: backendEvent.endDate,
    category: category,
    allDay: backendEvent.allDay,
    source: backendEvent.source || 'manual',
  };
};

const adaptUIEventToBackend = (uiEvent: Omit<UIEvent, 'id'>): Omit<BackendEvent, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    title: uiEvent.title,
    description: uiEvent.description || undefined,
    startDate: uiEvent.start,
    endDate: uiEvent.end,
    allDay: uiEvent.allDay ?? true,
    location: undefined,
    attendees: undefined,
    color: CATEGORY_TO_COLOR[uiEvent.category] || 'blue',
  };
};

interface CalendarPageProps {
  setActiveView: (view: View) => void;
}

const EVENT_CATEGORIES: Record<UIEvent['category'], { label: string, dot: string, bg: string, text: string, border: string }> = {
  Meeting: { label: 'Meeting', dot: 'bg-blue-500', bg: 'bg-blue-50 hover:bg-blue-100', text: 'text-blue-800', border: 'border-l-blue-500' },
  Deadline: { label: 'Deadline', dot: 'bg-red-500', bg: 'bg-red-50 hover:bg-red-100', text: 'text-red-800', border: 'border-l-red-500' },
  Shipment: { label: 'Shipment', dot: 'bg-yellow-400', bg: 'bg-yellow-50 hover:bg-yellow-100', text: 'text-yellow-800', border: 'border-l-yellow-400' },
  Personal: { label: 'Personal', dot: 'bg-green-500', bg: 'bg-green-50 hover:bg-green-100', text: 'text-green-800', border: 'border-l-green-500' },
  Other: { label: 'Other', dot: 'bg-gray-400', bg: 'bg-gray-100 hover:bg-gray-200', text: 'text-gray-800', border: 'border-l-gray-400' },
};

const UpcomingEvents: React.FC<{
  events: UIEvent[];
  currentDate: Date;
  onEdit: (event: UIEvent) => void;
}> = ({ events, currentDate, onEdit }) => {
    
    const upcomingEvents = useMemo(() => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

        return events
            .filter(event => {
                const eventStart = new Date(event.start);
                return eventStart >= startOfMonth && eventStart <= endOfMonth;
            })
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [events, currentDate]);

    const formatEventDate = (start: string, end: string, allDay: boolean) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

        if (allDay) {
            if (startDate.toDateString() === endDate.toDateString()) {
                return startDate.toLocaleDateString('en-US', options);
            }
            return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
        }
        
        const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        return `${startDate.toLocaleDateString('en-US', options)}, ${startDate.toLocaleTimeString('en-US', timeOptions)}`;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-full">
            <h3 className="text-base font-bold text-slate-800 p-4 border-b border-slate-200 flex-shrink-0">Próximos eventos</h3>
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(event => {
                        const categoryStyle = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES['Other'];
                        const isGoogleEvent = (event as any).source === 'google';
                        return (
                             <div key={event.id} onClick={() => onEdit(event)} className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200 ${categoryStyle.bg} ${categoryStyle.border}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <p className={`font-bold text-sm ${categoryStyle.text} flex-grow`}>{event.title}</p>
                                    {isGoogleEvent && (
                                        <GoogleCalendarIcon className="w-4 h-4 text-blue-500 flex-shrink-0" title="Synced from Google Calendar" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{formatEventDate(event.start, event.end, event.allDay)}</p>
                                {event.description && <p className="text-xs text-slate-600 mt-1 truncate">{event.description}</p>}
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center text-slate-500 py-10">
                        <CalendarDaysIcon className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="mt-2 font-medium">No hay eventos próximos este mes.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

const CalendarPage: React.FC<CalendarPageProps> = ({ setActiveView }) => {
  const [events, setEvents] = useState<UIEvent[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UIEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventToDelete, setEventToDelete] = useState<UIEvent | null>(null);
  
  // New multi-source filtering state
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [includeLocalEvents, setIncludeLocalEvents] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [selectedAccountIds, includeLocalEvents]);

  const loadAccounts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/google-auth/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmailAccounts(data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Build query parameters for multi-source filtering
      const params = new URLSearchParams();
      if (selectedAccountIds.length > 0) {
        params.append('emailAccountIds', selectedAccountIds.join(','));
      }
      if (includeLocalEvents) {
        params.append('includeLocal', 'true');
      }
      
      const url = `/api/calendar${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const backendEvents = await response.json();
        const uiEvents = backendEvents.map(adaptBackendEventToUI);
        setEvents(uiEvents);
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const daysInMonth = useMemo(() => {
    const days = [];
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const filteredEvents = useMemo(() => {
    return events;
  }, [events]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const openAddModal = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: UIEvent) => {
    setSelectedDate(null);
    setSelectedEvent(event);
    setIsModalOpen(true);
  };
  
  const handleSaveEvent = async (eventData: Omit<UIEvent, 'id'>, id?: string) => {
      try {
        const backendEventData = adaptUIEventToBackend(eventData);
        if (id) {
          await calendarService.update(id, backendEventData);
        } else {
          await calendarService.create(backendEventData);
        }
        await loadEvents();
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error saving event:', error);
      }
  };

  const handleDeleteRequest = (event: UIEvent) => {
    setIsModalOpen(false);
    setEventToDelete(event);
  };

  const confirmDelete = async () => {
    if (eventToDelete) {
        try {
          await calendarService.delete(eventToDelete.id);
          await loadEvents();
          setEventToDelete(null);
        } catch (error) {
          console.error('Error deleting event:', error);
        }
    }
  };
  
  const ProviderIcon: React.FC<{ provider: EmailAccount['provider'], className?: string }> = ({ provider, className = "w-6 h-6" }) => {
    switch(provider) {
        case 'gmail': return <GmailIcon className={className} />;
        case 'gsuite': return <GSuiteIcon className={className} />;
        default: return <MailIcon className={`${className} text-slate-400`} />;
    }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col space-y-6">
      <Banner
          title="Calendario"
          description="Organiza fechas límite, envíos y reuniones."
          icon={CalendarDaysIcon}
      />
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col flex-grow min-h-0">
        <header className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
              <div className="flex items-center">
                  <button onClick={handlePrevMonth} className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"><ChevronLeftIcon className="w-5 h-5" /></button>
                  <button onClick={handleNextMonth} className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"><ChevronRightIcon className="w-5 h-5" /></button>
              </div>
          </div>
          <button onClick={() => openAddModal(new Date())} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm">
              <PlusIcon className="w-5 h-5 mr-2" />
              Crear Evento
          </button>
        </header>
        
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            <div className="lg:col-span-2 flex flex-col">
                <div className="grid grid-cols-7 text-center font-semibold text-sm text-slate-500 flex-shrink-0">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day} className="py-2 border-b-2 border-slate-200">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 grid-rows-6 flex-grow min-h-0 border-l border-slate-200">
                    {daysInMonth.map((day, index) => {
                    const isToday = new Date().toDateString() === day.toDateString();
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    
                    const dayEvents = filteredEvents.filter(e => {
                        const start = new Date(e.start);
                        const end = new Date(e.end);
                        return day >= new Date(start.toDateString()) && day <= new Date(end.toDateString());
                    }).sort((a,b) => (a.allDay === b.allDay) ? new Date(a.start).getTime() - new Date(b.start).getTime() : a.allDay ? -1 : 1);

                    return (
                        <div
                        key={index}
                        onClick={() => openAddModal(day)}
                        className={`relative p-2 flex flex-col group border-b border-r border-slate-200 cursor-pointer ${isCurrentMonth ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/70'} transition-colors duration-200`}
                        >
                        <time
                            dateTime={day.toISOString()}
                            className={`text-xs font-semibold self-end mb-1.5 flex items-center justify-center w-6 h-6 rounded-full ${
                            isToday ? 'bg-red-600 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                            }`}
                        >
                            {day.getDate()}
                        </time>
                        <div className="flex-grow min-h-0 space-y-1 overflow-y-auto">
                            {dayEvents.length > 0 ? (
                                dayEvents.slice(0, 3).map(event => {
                                    const categoryStyle = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES['Other'];
                                    return (
                                        <div key={event.id} onClick={(e) => { e.stopPropagation(); openEditModal(event); }} className={`w-full text-left p-1 rounded-md text-xs truncate flex items-center gap-1.5 ${categoryStyle.bg} ${categoryStyle.text} font-semibold transition-all duration-200 hover:shadow-md`} title={event.title}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot} flex-shrink-0`}></div>
                                            <span className="truncate">{event.title}</span>
                                        </div>
                                    )
                                })
                            ) : (
                                isCurrentMonth && <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-300 h-full p-1 opacity-90">
                                    <PackageIcon className="w-5 h-5" />
                                    <span className="text-[9px] mt-1 font-semibold text-slate-400">Sin eventos</span>
                                </div>
                            )}
                            {dayEvents.length > 3 && (
                                <div className="text-xs font-bold text-slate-500 mt-1 pl-1">
                                    +{dayEvents.length - 3} más
                                </div>
                            )}
                        </div>
                        </div>
                    );
                    })}
                </div>
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6 min-h-0">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-slate-500"/> 
                        Filtrar eventos por fuente
                    </h3>
                    
                    {/* Local Events Checkbox */}
                    <label className="flex items-center gap-3 p-2 hover:bg-white rounded-md cursor-pointer transition-colors">
                        <input
                            type="checkbox"
                            checked={includeLocalEvents}
                            onChange={(e) => setIncludeLocalEvents(e.target.checked)}
                            className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                        />
                        <span className="font-semibold text-sm text-slate-800">Eventos Locales</span>
                    </label>
                    
                    {/* Email Accounts Checkboxes */}
                    {emailAccounts.length > 0 ? (
                        <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-slate-500 px-2 mb-1">Cuentas Vinculadas</p>
                            {emailAccounts.map(account => (
                                <label key={account.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-md cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedAccountIds.includes(account.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedAccountIds([...selectedAccountIds, account.id]);
                                            } else {
                                                setSelectedAccountIds(selectedAccountIds.filter(id => id !== account.id));
                                            }
                                        }}
                                        className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                                    />
                                    <ProviderIcon provider={account.provider} className="w-5 h-5" />
                                    <span className="font-semibold text-sm text-slate-800 flex-grow">{account.email}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 p-2 text-center mt-2">No hay cuentas vinculadas.</div>
                    )}
                    
                    <button onClick={() => setActiveView('integrations')} className="text-sm font-medium text-blue-600 hover:underline w-full text-center mt-3">
                        Administrar integraciones
                    </button>
                </div>
                
                <UpcomingEvents events={filteredEvents} currentDate={currentDate} onEdit={openEditModal} />
            </div>
        </div>
      </div>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEvent}
        onDeleteRequest={handleDeleteRequest}
        eventToEdit={selectedEvent}
        selectedDate={selectedDate}
      />
      <ConfirmationModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Event"
      >
        Are you sure you want to delete the event "{eventToDelete?.title}"? This action cannot be undone.
      </ConfirmationModal>
    </div>
  );
};

export default CalendarPage;
