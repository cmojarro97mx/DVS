import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { CogIcon } from '../components/icons/CogIcon';
import { FunnelIcon } from '../components/icons/FunnelIcon';
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

const adaptBackendEventToUI = (backendEvent: BackendEvent): UIEvent & { source?: 'manual' | 'google'; status?: string } => {
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
    status: backendEvent.status || 'scheduled',
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

const EmptyDayIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="14" r="1" fill="currentColor"/>
  </svg>
);

const UpcomingEvents: React.FC<{
  events: Array<UIEvent & { status?: string }>;
  currentDate: Date;
  onEdit: (event: UIEvent) => void;
}> = ({ events, currentDate, onEdit }) => {
    
    const upcomingEvents = useMemo(() => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

        return events
            .filter(event => {
                const eventStart = new Date(event.start);
                return eventStart >= startOfMonth && eventStart <= endOfMonth && event.status !== 'deleted' && event.status !== 'cancelled';
            })
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [events, currentDate]);

    const formatEventDate = (start: string, end: string, allDay: boolean) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

        if (allDay) {
            if (startDate.toDateString() === endDate.toDateString()) {
                return startDate.toLocaleDateString('es-ES', options);
            }
            return `${startDate.toLocaleDateString('es-ES', options)} - ${endDate.toLocaleDateString('es-ES', options)}`;
        }
        
        const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        return `${startDate.toLocaleDateString('es-ES', options)}, ${startDate.toLocaleTimeString('es-ES', timeOptions)}`;
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 flex flex-col flex-shrink-0">
            <h3 className="text-sm font-bold text-slate-800 p-3 border-b border-slate-200 flex-shrink-0">Próximos eventos</h3>
            <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: '400px' }}>
                {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(event => {
                        const categoryStyle = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES['Other'];
                        const isGoogleEvent = event.source === 'google';
                        const isCompleted = event.status === 'completed';
                        
                        return (
                             <div key={event.id} onClick={() => onEdit(event)} className={`p-2 md:p-3 rounded-lg border-l-4 cursor-pointer transition-colors ${categoryStyle.bg} ${categoryStyle.border} ${isCompleted ? 'opacity-60' : ''}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5 md:gap-2 flex-grow">
                                        <p className={`font-bold text-xs md:text-sm ${categoryStyle.text} ${isCompleted ? 'line-through' : ''}`}>{event.title}</p>
                                        {isCompleted && (
                                            <CheckCircleIcon className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" title="Completado" />
                                        )}
                                    </div>
                                    {isGoogleEvent && (
                                        <GoogleCalendarIcon className="w-3 h-3 md:w-4 md:h-4 text-blue-500 flex-shrink-0" title="Sincronizado con Google Calendar" />
                                    )}
                                </div>
                                <p className="text-[10px] md:text-xs text-slate-500 mt-1">{formatEventDate(event.start, event.end, event.allDay)}</p>
                                {event.description && <p className="text-[10px] md:text-xs text-slate-600 mt-1 truncate">{event.description}</p>}
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center text-slate-500 py-8 md:py-10">
                        <CalendarDaysIcon className="w-8 h-8 md:w-10 md:h-10 mx-auto text-slate-300" />
                        <p className="mt-2 text-xs md:text-sm font-medium">No hay eventos próximos este mes.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

const CalendarPage: React.FC<CalendarPageProps> = ({ setActiveView }) => {
  const [events, setEvents] = useState<Array<UIEvent & { status?: string }>>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UIEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventToDelete, setEventToDelete] = useState<UIEvent | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [includeLocalEvents, setIncludeLocalEvents] = useState(true);

  const loadAccounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/google-auth/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmailAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
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
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountIds, includeLocalEvents]);

  const syncAllAccounts = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('accessToken');
      
      for (const account of emailAccounts.filter(a => a.calendarSyncEnabled)) {
        await fetch('/api/google-calendar/sync-from-google', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accountId: account.id }),
        });
      }
      
      await loadEvents();
    } catch (error) {
      console.error('Error syncing calendars:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(() => {
      loadEvents();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [loadEvents]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadEvents();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadEvents]);

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
    const hasNoFiltersSelected = !includeLocalEvents && selectedAccountIds.length === 0;
    
    if (hasNoFiltersSelected) {
      return [];
    }
    
    return events.filter(e => {
      if (e.status === 'deleted') return false;
      
      const isLocalEvent = e.source !== 'google';
      const isGoogleEvent = e.source === 'google';
      
      if (isLocalEvent && includeLocalEvents) return true;
      if (isGoogleEvent && selectedAccountIds.length > 0) return true;
      
      return false;
    });
  }, [events, includeLocalEvents, selectedAccountIds]);

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
    <div className="animate-fade-in flex flex-col space-y-4 md:space-y-6" style={{ height: 'calc(100vh - 100px)' }}>
      <Banner
          title="Calendario"
          description="Organiza fechas límite, envíos y reuniones con sincronización automática."
          icon={CalendarDaysIcon}
      />
      
      <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-6 flex flex-col flex-1 overflow-hidden">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-lg md:text-xl font-bold text-slate-800 tracking-tight capitalize">
              {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-1">
                <button onClick={handlePrevMonth} className="p-1.5 rounded text-slate-600 hover:bg-slate-100 transition-colors">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button onClick={handleNextMonth} className="p-1.5 rounded text-slate-600 hover:bg-slate-100 transition-colors">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] md:text-xs text-slate-400 whitespace-nowrap">
                {lastUpdate.toLocaleTimeString('es-ES')}
              </span>
            </div>
          </div>
          <button onClick={() => openAddModal(new Date())} className="flex items-center bg-red-600 text-white px-3 py-1.5 md:py-2 rounded text-xs md:text-sm font-semibold hover:bg-red-700 w-full sm:w-auto justify-center flex-shrink-0">
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Crear Evento
          </button>
        </header>
        
        <div className="flex-1 flex flex-col xl:flex-row gap-4 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="grid grid-cols-7 text-center font-semibold text-xs text-slate-500 flex-shrink-0">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day} className="py-1.5 border-b border-slate-200">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 flex-1 border-l border-slate-200 overflow-y-auto" style={{ gridAutoRows: 'minmax(120px, 1fr)' }}>
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
                        className={`relative p-1 md:p-2 flex flex-col group border-b border-r border-slate-200 cursor-pointer ${isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50'} transition-colors`}
                        >
                        <time
                            dateTime={day.toISOString()}
                            className={`text-[10px] md:text-xs font-semibold self-end mb-1 flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full ${
                            isToday ? 'bg-red-600 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                            }`}
                        >
                            {day.getDate()}
                        </time>
                        <div className="flex-grow min-h-0 space-y-0.5 md:space-y-1 overflow-y-auto">
                            {dayEvents.length > 0 ? (
                                dayEvents.slice(0, 2).map(event => {
                                    const categoryStyle = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES['Other'];
                                    const isCompleted = event.status === 'completed';
                                    const isCancelled = event.status === 'cancelled';
                                    
                                    return (
                                        <div key={event.id} onClick={(e) => { e.stopPropagation(); openEditModal(event); }} className={`w-full text-left px-1 py-0.5 md:p-1 rounded text-[9px] md:text-xs truncate flex items-center gap-1 ${categoryStyle.bg} ${categoryStyle.text} font-semibold transition-colors hover:brightness-95 ${(isCompleted || isCancelled) ? 'opacity-60' : ''}`} title={event.title}>
                                            <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${categoryStyle.dot} flex-shrink-0`}></div>
                                            <span className={`truncate ${isCompleted || isCancelled ? 'line-through' : ''}`}>{event.title}</span>
                                            {isCompleted && <CheckCircleIcon className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />}
                                            {isCancelled && <XCircleIcon className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />}
                                        </div>
                                    )
                                })
                            ) : (
                                isCurrentMonth && <div className="hidden md:flex flex-grow flex-col items-center justify-center text-center text-slate-300 h-full p-1">
                                    <EmptyDayIcon className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="text-[8px] md:text-[9px] mt-1 font-medium text-slate-400">Sin eventos</span>
                                </div>
                            )}
                            {dayEvents.length > 2 && (
                                <div className="text-[9px] md:text-xs font-bold text-slate-500 pl-0.5 md:pl-1">
                                    +{dayEvents.length - 2} más
                                </div>
                            )}
                        </div>
                        </div>
                    );
                    })}
                </div>
            </div>

            <div className="xl:w-80 flex flex-col gap-4 min-h-0 overflow-y-auto flex-shrink-0">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-shrink-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-3.5 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <FunnelIcon className="w-4 h-4 text-slate-600"/> 
                                Filtrar eventos por fuente
                            </h3>
                            {syncing && (
                                <RefreshIcon className="w-4 h-4 text-blue-600 animate-spin" />
                            )}
                        </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                        <label className="flex items-center gap-3 p-2.5 bg-slate-50/50 rounded-lg cursor-pointer transition-all hover:bg-slate-100/80 border border-transparent hover:border-slate-200 group">
                            <div className="relative flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={includeLocalEvents}
                                    onChange={(e) => setIncludeLocalEvents(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="w-5 h-5 bg-white border-2 border-slate-300 rounded peer-checked:bg-red-600 peer-checked:border-red-600 transition-all flex items-center justify-center shadow-sm">
                                    {includeLocalEvents && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 flex-grow">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                    <CalendarDaysIcon className="w-4 h-4 text-red-600" />
                                </div>
                                <div className="flex-grow">
                                    <span className="font-semibold text-sm text-slate-800 block">Eventos Locales</span>
                                    <span className="text-xs text-slate-500">Creados manualmente</span>
                                </div>
                            </div>
                        </label>
                        
                        {emailAccounts.length > 0 ? (
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2 px-1 pt-1">
                                    <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-grow"></div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Google Calendar</p>
                                    <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-grow"></div>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                    {emailAccounts.map(account => (
                                        <label key={account.id} className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:shadow-sm group">
                                            <div className="relative flex-shrink-0">
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
                                                    className="peer sr-only"
                                                />
                                                <div className="w-5 h-5 bg-white border-2 border-slate-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center shadow-sm">
                                                    {selectedAccountIds.includes(account.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                                                <ProviderIcon provider={account.provider} className="w-4 h-4" />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <span className="font-semibold text-sm text-slate-800 block truncate">{account.email}</span>
                                                {account.calendarSyncEnabled ? (
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                        <span className="text-xs text-green-600 font-medium">Activo</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                                                        <span className="text-xs text-slate-500 font-medium">Inactivo</span>
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 px-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <GoogleCalendarIcon className="w-7 h-7 text-slate-400" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700 mb-1.5">Sin cuentas vinculadas</p>
                                <p className="text-xs text-slate-500 mb-4 leading-relaxed">Conecta Google Calendar para<br/>sincronizar tus eventos</p>
                                <button
                                    onClick={() => setActiveView('integrations')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                    Vincular cuenta
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {emailAccounts.length > 0 && (
                        <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-3">
                            <button 
                                onClick={() => setActiveView('integrations')} 
                                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors py-1"
                            >
                                <CogIcon className="w-4 h-4" />
                                Configurar integraciones
                            </button>
                        </div>
                    )}
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
        title="Eliminar Evento"
      >
        ¿Estás seguro de que deseas eliminar el evento "{eventToDelete?.title}"? Esta acción no se puede deshacer.
      </ConfirmationModal>
    </div>
  );
};

// Agregar estilos para scrollbar personalizada
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;
if (!document.querySelector('style[data-calendar-styles]')) {
  style.setAttribute('data-calendar-styles', 'true');
  document.head.appendChild(style);
}

export default CalendarPage;
