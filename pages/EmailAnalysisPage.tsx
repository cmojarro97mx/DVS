import React, { useState, useEffect } from 'react';
import { Banner } from '../components/Banner';
import { ChartPieIcon } from '../components/icons/ChartPieIcon';
import { View } from './DashboardPage';
import { InboxIcon } from '../components/icons/InboxIcon';
import { PaperAirplaneIcon } from '../components/icons/PaperAirplaneIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EmailAvatar } from '../components/EmailAvatar';
import { ClockIcon } from '../components/icons/ClockIcon';

interface EmailAnalysisPageProps {
    setActiveView: (view: View) => void;
}

interface EmailAccount {
    id: string;
    email: string;
    provider: string;
    status: string;
    syncEmail: boolean;
    lastEmailSync: string | null;
    totalMessagesInGmail: number;
    syncedMessagesCount: number;
}

interface EmailMetrics {
    totalMessages: number;
    downloadedMessages: number;
    repliedMessages: number;
    unrepliedMessages: number;
    unreadMessages: number;
    lastSync: string | null;
}

interface EmailMessage {
    id: string;
    gmailMessageId: string;
    threadId: string | null;
    from: string;
    fromName: string | null;
    to: any;
    cc: any;
    subject: string;
    snippet: string;
    date: string;
    unread: boolean;
    starred: boolean;
    isReplied: boolean;
    hasAttachments: boolean;
    folder: string;
    labels: any;
}

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ElementType;
    color?: string;
}> = ({ title, value, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200 text-blue-600',
        green: 'bg-green-50 border-green-200 text-green-600',
        orange: 'bg-orange-50 border-orange-200 text-orange-600',
        purple: 'bg-purple-50 border-purple-200 text-purple-600',
        slate: 'bg-slate-50 border-slate-200 text-slate-600',
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0 border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-grow">
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
            </div>
        </div>
    );
};

const EmailRow: React.FC<{
    email: EmailMessage;
    onClick: () => void;
}> = ({ email, onClick }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 168) {
            return date.toLocaleDateString('es-ES', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        }
    };

    const getRecipients = () => {
        if (Array.isArray(email.to)) {
            return email.to.map((t: any) => t.email || t).join(', ');
        }
        return '';
    };

    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors ${
                email.unread ? 'bg-blue-50/30' : 'bg-white'
            }`}
        >
            <EmailAvatar email={email.from} name={email.fromName || email.from} size="md" />
            
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm truncate ${email.unread ? 'text-slate-900' : 'text-slate-700'}`}>
                        {email.fromName || email.from}
                    </span>
                    {email.hasAttachments && (
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    )}
                    {email.isReplied && (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    )}
                </div>
                <p className={`text-sm truncate ${email.unread ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                    {email.subject}
                </p>
                <p className="text-xs text-slate-500 truncate mt-1">{email.snippet}</p>
                {email.to && (
                    <p className="text-xs text-slate-400 truncate mt-1">
                        Para: {getRecipients()}
                    </p>
                )}
            </div>
            
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs text-slate-500">{formatDate(email.date)}</span>
                {email.unread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
            </div>
        </div>
    );
};

const EmailAnalysisPage: React.FC<EmailAnalysisPageProps> = ({ setActiveView }) => {
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
    const [emails, setEmails] = useState<EmailMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            fetchMetrics();
            fetchEmails();
        }
    }, [selectedAccount, page]);

    useEffect(() => {
        if (!selectedAccount) return;
        
        const interval = setInterval(() => {
            fetchMetrics();
            fetchAccounts();
        }, 30000);

        return () => clearInterval(interval);
    }, [selectedAccount]);

    const fetchAccounts = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/email-sync/accounts', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (response.ok) {
                const data = await response.json();
                setAccounts(data);
                if (data.length > 0 && !selectedAccount) {
                    setSelectedAccount(data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMetrics = async () => {
        if (!selectedAccount) return;
        
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/email-sync/metrics/${selectedAccount}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (response.ok) {
                const data = await response.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    };

    const fetchEmails = async () => {
        if (!selectedAccount) return;
        
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `/api/email-sync/messages/${selectedAccount}?page=${page}&limit=50`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                setEmails(data.messages);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching emails:', error);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (accounts.length === 0) {
        return (
            <div className="animate-fade-in">
                <Banner
                    title="Análisis de Correo"
                    description="Analiza tus correos electrónicos para obtener insights y métricas detalladas."
                    icon={ChartPieIcon}
                />
                <div className="mt-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-16">
                    <div className="bg-slate-200/70 rounded-full p-4 mb-4 inline-block">
                        <InboxIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">No hay cuentas con sincronización activa</h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                        Ve a Integraciones y activa la sincronización de emails en al menos una cuenta de Gmail.
                    </p>
                    <button
                        onClick={() => setActiveView('integrations')}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Ir a Integraciones
                    </button>
                </div>
            </div>
        );
    }

    const selectedAccountData = accounts.find(a => a.id === selectedAccount);

    return (
        <div className="animate-fade-in space-y-6">
            <Banner
                title="Análisis de Correo"
                description="Visualiza métricas y actividad de tus correos electrónicos sincronizados."
                icon={ChartPieIcon}
            />

            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-grow max-w-md">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Cuenta de Correo Activa
                        </label>
                        <select
                            value={selectedAccount || ''}
                            onChange={(e) => {
                                setSelectedAccount(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.email} (Total en Gmail: {account.totalMessagesInGmail} mensajes)
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="ml-4 flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Sincronización automática activa</span>
                    </div>
                </div>

                {selectedAccountData?.lastEmailSync && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <ClockIcon className="w-4 h-4" />
                        <span>
                            Última sincronización: {new Date(selectedAccountData.lastEmailSync).toLocaleString('es-ES')}
                        </span>
                    </div>
                )}
                <p className="text-xs text-slate-400 mt-2">
                    Los correos se sincronizan automáticamente cada 10 minutos en segundo plano
                </p>
            </div>

            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                        title="Total en Gmail"
                        value={metrics.totalMessages.toLocaleString()}
                        icon={InboxIcon}
                        color="blue"
                    />
                    <StatCard
                        title="Mensajes Descargados"
                        value={metrics.downloadedMessages.toLocaleString()}
                        icon={EyeIcon}
                        color="green"
                    />
                    <StatCard
                        title="Contestados"
                        value={metrics.repliedMessages.toLocaleString()}
                        icon={CheckCircleIcon}
                        color="purple"
                    />
                    <StatCard
                        title="Sin Contestar"
                        value={metrics.unrepliedMessages.toLocaleString()}
                        icon={PaperAirplaneIcon}
                        color="orange"
                    />
                    <StatCard
                        title="No Leídos"
                        value={metrics.unreadMessages.toLocaleString()}
                        icon={InboxIcon}
                        color="slate"
                    />
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">Actividad de Correos</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Todos los correos sincronizados de esta cuenta
                    </p>
                </div>

                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {emails.length === 0 ? (
                        <div className="p-12 text-center">
                            <InboxIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No hay correos sincronizados aún</p>
                            <button
                                onClick={handleSync}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Sincronizar Ahora
                            </button>
                        </div>
                    ) : (
                        emails.map((email) => (
                            <EmailRow
                                key={email.id}
                                email={email}
                                onClick={() => {
                                    console.log('Email clicked:', email);
                                }}
                            />
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <span className="text-sm text-slate-600">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailAnalysisPage;
