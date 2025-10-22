import React, { useState, useMemo, useRef, useEffect } from 'react';
import { EmailAccount, EmailMessage, View } from './DashboardPage';
import { AtSymbolIcon } from '../components/icons/AtSymbolIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { LinkIcon } from '../components/icons/LinkIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { InboxIcon } from '../components/icons/InboxIcon';
import { PaperAirplaneIcon } from '../components/icons/PaperAirplaneIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EmailAvatar } from '../components/EmailAvatar';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { ChartPieIcon } from '../components/icons/ChartPieIcon';
import { Bars3Icon } from '../components/icons/Bars3Icon';


interface LinkedAccountsPageProps {
    accounts: EmailAccount[];
    emails: EmailMessage[];
    setActiveView: (view: View) => void;
}

interface GoogleAccount {
    id: string;
    email: string;
    provider: string;
    status: string;
    syncEmail: boolean;
    syncCalendar: boolean;
}

interface GmailMessage {
    id: string;
    threadId: string;
    labelIds?: string[];
    snippet: string;
    internalDate?: string;
    payload?: {
        headers?: Array<{
            name: string;
            value: string;
        }>;
    };
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex items-start gap-5">
      <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg flex-shrink-0 border border-slate-200">
        <Icon className="w-6 h-6 text-slate-600" />
      </div>
      <div className="flex-grow">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
    </div>
);

const TabButton: React.FC<{ label: string, icon: React.ElementType, isActive: boolean, onClick: () => void }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
);


const LinkedAccountsPage: React.FC<LinkedAccountsPageProps> = ({ setActiveView }) => {
    const [linkedAccounts, setLinkedAccounts] = useState<GoogleAccount[]>([]);
    const [emailMessages, setEmailMessages] = useState<EmailMessage[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
    const [loading, setLoading] = useState(true);
    const [loadingEmails, setLoadingEmails] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const EMAILS_PER_PAGE = 10;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedAccountId, searchQuery]);

    useEffect(() => {
        fetchLinkedAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccountId) {
            fetchEmails(selectedAccountId);
        }
    }, [selectedAccountId]);

    const fetchLinkedAccounts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/google-auth/status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.accounts && data.accounts.length > 0) {
                    setLinkedAccounts(data.accounts);
                    setSelectedAccountId(data.accounts[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching linked accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmails = async (accountId: string) => {
        try {
            setLoadingEmails(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/gmail/messages?accountId=${accountId}&maxResults=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const messages: GmailMessage[] = await response.json();
                
                const emailPromises = messages.map(async (msg) => {
                    try {
                        const detailResponse = await fetch(`/api/gmail/messages/${msg.id}?accountId=${accountId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });
                        
                        if (detailResponse.ok) {
                            const detail = await detailResponse.json();
                            return parseGmailMessage(detail, accountId);
                        }
                        return null;
                    } catch (error) {
                        console.error(`Error fetching message ${msg.id}:`, error);
                        return null;
                    }
                });

                const emails = await Promise.all(emailPromises);
                const validEmails = emails.filter((e): e is EmailMessage => e !== null);
                setEmailMessages(validEmails);
            }
        } catch (error) {
            console.error('Error fetching emails:', error);
        } finally {
            setLoadingEmails(false);
        }
    };

    const parseGmailMessage = (gmailMsg: any, accountId: string): EmailMessage | null => {
        try {
            const headers = gmailMsg.payload?.headers || [];
            const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

            const from = getHeader('from');
            const fromName = from.includes('<') ? from.split('<')[0].trim() : from.split('@')[0];
            const subject = getHeader('subject') || '(Sin asunto)';
            const date = getHeader('date') || new Date(parseInt(gmailMsg.internalDate || '0')).toISOString();
            const to = getHeader('to').split(',').map((t: string) => t.trim());
            
            const isUnread = gmailMsg.labelIds?.includes('UNREAD') || false;
            const isSent = gmailMsg.labelIds?.includes('SENT') || false;
            const folder = isSent ? 'sent' : 'inbox';

            return {
                id: gmailMsg.id,
                threadId: gmailMsg.threadId,
                accountId: accountId,
                folder: folder,
                from: from,
                fromName: fromName,
                to: to,
                subject: subject,
                snippet: gmailMsg.snippet || '',
                body: gmailMsg.snippet || '',
                date: date,
                unread: isUnread,
                starred: gmailMsg.labelIds?.includes('STARRED') || false,
                attachments: [],
            };
        } catch (error) {
            console.error('Error parsing Gmail message:', error);
            return null;
        }
    };

    const selectedAccount = useMemo(() => {
        return linkedAccounts.find(acc => acc.id === selectedAccountId);
    }, [linkedAccounts, selectedAccountId]);
    
    const accountEmails = useMemo(() => {
        if (!selectedAccountId) return [];
        return emailMessages
            .filter(email => email.accountId === selectedAccountId)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [emailMessages, selectedAccountId]);

    const filteredEmails = useMemo(() => {
        if (!searchQuery) return accountEmails;
        const lowerQuery = searchQuery.toLowerCase();
        return accountEmails.filter(email => 
            email.subject.toLowerCase().includes(lowerQuery) ||
            email.fromName.toLowerCase().includes(lowerQuery)
        );
    }, [accountEmails, searchQuery]);
    
    const totalPages = Math.ceil(filteredEmails.length / EMAILS_PER_PAGE);
    const paginatedEmails = useMemo(() => {
        const startIndex = (currentPage - 1) * EMAILS_PER_PAGE;
        const endIndex = startIndex + EMAILS_PER_PAGE;
        return filteredEmails.slice(startIndex, endIndex);
    }, [filteredEmails, currentPage]);


    const stats = useMemo(() => {
        const total = accountEmails.length;
        const received = accountEmails.filter(e => e.folder === 'inbox').length;
        const sent = accountEmails.filter(e => e.folder === 'sent').length;
        const unread = accountEmails.filter(e => e.unread && e.folder === 'inbox').length;
        return { total, received, sent, unread };
    }, [accountEmails]);

    const handleSelectAccount = (accountId: string) => {
        setSelectedAccountId(accountId);
        setIsDropdownOpen(false);
    };

    if (loading) {
        return (
            <div className="animate-fade-in text-center flex flex-col items-center justify-center h-full bg-white rounded-xl border border-gray-200 p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-slate-600">Cargando cuentas vinculadas...</p>
            </div>
        );
    }

    if (linkedAccounts.length === 0) {
        return (
            <div className="animate-fade-in text-center flex flex-col items-center justify-center h-full bg-white rounded-xl border border-gray-200 p-8">
                <div className="bg-slate-100 rounded-full p-5">
                    <LinkIcon className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-800">No hay cuentas de correo electrónico conectadas</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-sm">
                    Para ver las estadísticas y la actividad, primero debes vincular una cuenta de correo electrónico activa.
                </p>
                <button 
                    onClick={() => setActiveView('integrations')} 
                    className="mt-6 flex items-center bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Ir a Integraciones
                </button>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in space-y-6">
            <style>{`
                .email-list-scroll::-webkit-scrollbar { width: 6px; }
                .email-list-scroll::-webkit-scrollbar-track { background: transparent; }
                .email-list-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .email-list-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {/* Header */}
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex-shrink-0 bg-slate-100 rounded-full flex items-center justify-center">
                                <AtSymbolIcon className="w-7 h-7 text-slate-600"/>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Análisis de Correo</h2>
                                <p className="text-sm text-gray-500">Revisa la actividad y estadísticas de tus cuentas conectadas.</p>
                            </div>
                        </div>
                    </div>
                     <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="relative w-full md:w-auto" ref={dropdownRef}>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                                CUENTA DE CORREO ACTIVA
                            </label>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-sm w-full md:w-72 justify-between hover:border-slate-400 transition-colors">
                                <div className="flex items-center gap-3 truncate">
                                    <AtSymbolIcon className="w-5 h-5 text-slate-500" />
                                    <span className="font-semibold text-slate-800 truncate">{selectedAccount?.email}</span>
                                </div>
                                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute z-10 top-full mt-2 w-full md:w-72 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                                    {linkedAccounts.map(acc => (
                                        <button key={acc.id} onClick={() => handleSelectAccount(acc.id)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between">
                                            {acc.email}
                                            {selectedAccountId === acc.id && <CheckCircleIcon className="w-5 h-5 text-blue-600" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                         <div className="relative w-full md:w-auto flex-grow md:flex-grow-0">
                             <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Buscar en esta cuenta</label>
                             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 mt-3 w-5 h-5 text-slate-400" />
                             <input 
                                type="text" 
                                placeholder="Buscar por asunto o remitente..." 
                                className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-red-500 focus:border-red-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                             />
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-t border-b border-gray-200">
                    <nav className="flex items-center gap-2 p-2">
                        <TabButton label="Overview" icon={ChartPieIcon} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <TabButton label="Activity" icon={Bars3Icon} isActive={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6 bg-slate-50/50">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Correos Recibidos" value={stats.received} icon={InboxIcon} />
                            <StatCard title="Correos Enviados" value={stats.sent} icon={PaperAirplaneIcon} />
                            <StatCard title="No Leídos" value={stats.unread} icon={EyeIcon} />
                            <StatCard title="Estado del Servicio" value={selectedAccount?.status === 'connected' ? 'Activo' : 'Inactivo'} icon={CheckCircleIcon} />
                        </div>
                    )}
                    {activeTab === 'activity' && (
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            {loadingEmails ? (
                                <div className="text-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-slate-600">Cargando correos...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-y-auto email-list-scroll" style={{maxHeight: '30rem'}}>
                                        {paginatedEmails.length > 0 ? (
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50">
                                                        <th className="py-2 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">From</th>
                                                        <th className="py-2 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                                                        <th className="py-2 px-6 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-200">
                                                    {paginatedEmails.map(email => (
                                                        <tr key={email.id} className="transition-colors cursor-pointer hover:bg-slate-50">
                                                            <td className="px-6 py-2.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2 flex-shrink-0">
                                                                        {email.unread && <div className="h-2 w-2 bg-blue-500 rounded-full"></div>}
                                                                    </div>
                                                                    <EmailAvatar name={email.fromName} />
                                                                    <span className="font-medium text-slate-800">{email.fromName}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-2.5 max-w-0">
                                                                <p className="truncate font-medium text-slate-700">{email.subject}</p>
                                                            </td>
                                                            <td className="px-6 py-2.5 text-right">
                                                                <p className="text-sm whitespace-nowrap text-slate-500">
                                                                    {new Date(email.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="text-center py-20 text-slate-500">
                                                <AtSymbolIcon className="w-12 h-12 mx-auto text-slate-300" />
                                                <p className="mt-2 font-medium">No se encontraron correos para esta cuenta.</p>
                                            </div>
                                        )}
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="p-2 border-t border-slate-200 flex justify-between items-center text-sm">
                                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                                <ChevronLeftIcon className="w-4 h-4" /> Anterior
                                            </button>
                                            <span className="font-medium text-slate-600">Página {currentPage} de {totalPages}</span>
                                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                                Siguiente <ChevronRightIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LinkedAccountsPage;
