
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
import { CalendarIcon } from '../components/icons/CalendarIcon';

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
    syncFromDate: string | null;
    detectedOldestEmailDate: string | null;
    detectedNewestEmailDate: string | null;
}

interface EmailMetrics {
    totalMessages: number;
    downloadedMessages: number;
    repliedMessages: number;
    unrepliedMessages: number;
    unreadMessages: number;
    lastSync: string | null;
    syncFromDate: string | null;
    detectedOldestEmailDate: string | null;
    detectedNewestEmailDate: string | null;
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
    gradient?: string;
    subtitle?: string;
}> = ({ title, value, icon: Icon, gradient = 'from-blue-500 to-blue-600', subtitle }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-3xl font-bold text-slate-900">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-slate-400">{subtitle}</p>
                    )}
                </div>
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
            className={`group flex items-center gap-4 p-4 cursor-pointer border-b border-slate-50 transition-all duration-200 ${
                email.unread 
                    ? 'bg-blue-50/40 hover:bg-blue-50/60' 
                    : 'bg-white hover:bg-slate-50'
            }`}
        >
            <EmailAvatar email={email.from} name={email.fromName || email.from} size="md" />
            
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm truncate ${email.unread ? 'text-slate-900' : 'text-slate-600'}`}>
                        {email.fromName || email.from}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {email.hasAttachments && (
                            <div className="bg-slate-100 p-1 rounded">
                                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                            </div>
                        )}
                        {email.isReplied && (
                            <div className="bg-green-100 p-1 rounded">
                                <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" />
                            </div>
                        )}
                    </div>
                </div>
                <p className={`text-sm truncate mb-1 ${email.unread ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                    {email.subject}
                </p>
                <p className="text-xs text-slate-400 truncate">{email.snippet}</p>
                {email.to && (
                    <p className="text-xs text-slate-400 truncate mt-1">
                        Para: {getRecipients()}
                    </p>
                )}
            </div>
            
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs font-medium text-slate-500">{formatDate(email.date)}</span>
                {email.unread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
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
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
                        <ChartPieIcon className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-6 text-slate-600 font-medium">Cargando análisis...</p>
                </div>
            </div>
        );
    }

    if (accounts.length === 0) {
        return (
            <div className="animate-fade-in min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <Banner
                    title="Análisis de Correo"
                    description="Analiza tus correos electrónicos para obtener insights y métricas detalladas."
                    icon={ChartPieIcon}
                />
                <div className="mt-8 max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-12 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-sm mb-6">
                                <InboxIcon className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No hay cuentas sincronizadas</h3>
                            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                                Para comenzar a analizar tus correos, activa la sincronización de emails en al menos una cuenta de Gmail desde Integraciones.
                            </p>
                            <button
                                onClick={() => setActiveView('integrations')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                Ir a Integraciones
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const selectedAccountData = accounts.find(a => a.id === selectedAccount);

    return (
        <div className="animate-fade-in min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 space-y-6">
            <Banner
                title="Análisis de Correo"
                description="Visualiza métricas y actividad de tus correos electrónicos sincronizados."
                icon={ChartPieIcon}
            />

            {/* Account Selector Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-white p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-grow max-w-2xl">
                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                Cuenta de Correo Activa
                            </label>
                            <select
                                value={selectedAccount || ''}
                                onChange={(e) => {
                                    setSelectedAccount(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-700 transition-all duration-200"
                            >
                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.email} • {account.totalMessagesInGmail.toLocaleString()} mensajes en Gmail
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-sm"></span>
                            </div>
                            <span className="text-sm font-semibold text-green-700">Sincronización activa</span>
                        </div>
                    </div>

                    {selectedAccountData?.lastEmailSync && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <ClockIcon className="w-4 h-4" />
                                <span className="font-medium">
                                    Última sincronización: {new Date(selectedAccountData.lastEmailSync).toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 ml-6">
                                Los correos se sincronizan automáticamente cada 10 minutos
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sync Period Info */}
            {metrics && metrics.syncFromDate && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                                    <CalendarIcon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-base font-bold text-blue-900 mb-1">Período de Sincronización Configurado</h3>
                                <p className="text-sm text-blue-700 mb-3">
                                    Sincronizando correos desde <span className="font-semibold">{new Date(metrics.syncFromDate).toLocaleDateString('es-ES', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}</span> hasta hoy
                                </p>
                                <div className="flex items-center gap-2 text-xs text-blue-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        Solo se muestran correos desde la fecha configurada. Para cambiar el período, desactiva y vuelve a activar la sincronización.
                                    </span>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Descargados</p>
                                <p className="text-3xl font-bold text-blue-900">{metrics.downloadedMessages.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics Cards */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    <StatCard
                        title="Total en el Período"
                        value={metrics.downloadedMessages.toLocaleString()}
                        subtitle={`${metrics.totalMessages.toLocaleString()} en total en Gmail`}
                        icon={InboxIcon}
                        gradient="from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Contestados"
                        value={metrics.repliedMessages.toLocaleString()}
                        icon={CheckCircleIcon}
                        gradient="from-purple-500 to-purple-600"
                    />
                    <StatCard
                        title="Sin Contestar"
                        value={metrics.unrepliedMessages.toLocaleString()}
                        icon={PaperAirplaneIcon}
                        gradient="from-orange-500 to-orange-600"
                    />
                    <StatCard
                        title="No Leídos"
                        value={metrics.unreadMessages.toLocaleString()}
                        icon={EyeIcon}
                        gradient="from-slate-500 to-slate-600"
                    />
                </div>
            )}

            {/* Email List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Actividad de Correos</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Todos los correos sincronizados de esta cuenta
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                            <span className="text-sm font-semibold text-blue-700">{emails.length} correos</span>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                    {emails.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
                                <InboxIcon className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-medium mb-1">No hay correos sincronizados aún</p>
                            <p className="text-xs text-slate-400">
                                La sincronización automática está en progreso. Los correos aparecerán aquí pronto.
                            </p>
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
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-2 border-slate-200 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Anterior
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-700">
                                    Página {page} de {totalPages}
                                </span>
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-2 border-slate-200 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200"
                            >
                                Siguiente
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailAnalysisPage;
