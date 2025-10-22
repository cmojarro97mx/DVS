import React, { useState, useEffect } from 'react';
import { Banner } from '../components/Banner';
import { LinkIcon } from '../components/icons/LinkIcon';
import { View } from './DashboardPage';
import { GmailIcon } from '../components/icons/GmailIcon';
import { GoogleCalendarIcon } from '../components/icons/GoogleCalendarIcon';
import { GSuiteIcon } from '../components/icons/GSuiteIcon';
import { MailIcon } from '../components/icons/MailIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import EmailSyncWizard from '../src/components/email-sync/EmailSyncWizard';

interface IntegrationsPageProps {
    setActiveView: (view: View) => void;
}

interface GoogleAccount {
    id: string;
    email: string;
    status: string;
    gmailSyncEnabled: boolean;
    calendarSyncEnabled: boolean;
    tokenExpiry: string | null;
    lastGmailSync?: string | null;
    lastCalendarSync?: string | null;
}

interface GoogleConnectionStatus {
    connected: boolean;
    accounts: GoogleAccount[];
}

const HubCard: React.FC<{
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    isConnected?: boolean;
    isLoading?: boolean;
}> = ({ title, description, icon: Icon, onClick, isConnected, isLoading }) => (
    <button
        onClick={onClick}
        disabled={isLoading}
        className="w-full flex items-center p-4 bg-white rounded-xl border border-slate-200 transition-all duration-300 group hover:border-blue-400 hover:bg-blue-50/30 hover:-translate-y-0.5 disabled:bg-slate-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:-translate-y-0"
    >
        <div className={`p-3 rounded-lg border transition-colors ${isConnected ? 'bg-green-50 border-green-200' : 'bg-slate-100 group-hover:bg-blue-50 group-hover:border-blue-200'}`}>
            <Icon className={`w-6 h-6 transition-colors ${isConnected ? 'text-green-600' : 'text-slate-600 group-hover:text-blue-600'}`} />
        </div>
        <div className="ml-4 text-left flex-grow">
            <h3 className={`font-bold transition-colors ${isConnected ? 'text-slate-800' : 'text-slate-800'}`}>{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        {isLoading ? (
            <div className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                Loading...
            </div>
        ) : (
            <div className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full border border-slate-200 group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                {isConnected ? `${isConnected} account${isConnected === 1 ? '' : 's'}` : 'Connect'}
            </div>
        )}
    </button>
);

const ConnectedGoogleAccount: React.FC<{ 
    account: GoogleAccount;
    onDisconnect: (accountId: string) => void;
    onToggleGmail: (accountId: string, enabled: boolean) => void;
    onToggleCalendar: (accountId: string, enabled: boolean) => void;
}> = ({ account, onDisconnect, onToggleGmail, onToggleCalendar }) => {
    return (
        <div className="p-6 bg-white transition-colors hover:bg-slate-50/70 rounded-xl border border-slate-200">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <GSuiteIcon className="w-10 h-10 flex-shrink-0" />
                    <div>
                        <span className="font-bold text-lg text-slate-800">{account.email}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                             <div className="w-2 h-2 rounded-full bg-green-500"></div>
                             <span className="text-xs font-semibold text-green-700">Connected</span>
                        </div>
                    </div>
                </div>
                 <button 
                    onClick={() => onDisconnect(account.id)}
                    className="text-sm font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                >
                    Disconnect
                </button>
            </div>
            
            <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                        <GmailIcon className="w-5 h-5 text-slate-500" />
                        <div>
                            <span className="text-sm font-medium text-slate-700">Gmail</span>
                            <p className="text-xs text-slate-400">Sync emails</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onToggleGmail(account.id, !account.gmailSyncEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            account.gmailSyncEnabled ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            account.gmailSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
                <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                        <GoogleCalendarIcon className="w-5 h-5 text-slate-500" />
                        <div>
                            <span className="text-sm font-medium text-slate-700">Calendar</span>
                            <p className="text-xs text-slate-400">Sync events automatically</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onToggleCalendar(account.id, !account.calendarSyncEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            account.calendarSyncEnabled ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            account.calendarSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
                {account.tokenExpiry && (
                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t">
                        Token expires: {new Date(account.tokenExpiry).toLocaleString('es-ES')}
                    </p>
                )}
                {account.lastCalendarSync && account.calendarSyncEnabled && (
                    <p className="text-xs text-slate-400">
                        Last calendar sync: {new Date(account.lastCalendarSync).toLocaleString('es-ES')}
                    </p>
                )}
            </div>
        </div>
    );
};

const IntegrationSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">{title}</h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);


const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ setActiveView }) => {
    const [googleStatus, setGoogleStatus] = useState<GoogleConnectionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSyncWizard, setShowSyncWizard] = useState(false);
    const [wizardAccountId, setWizardAccountId] = useState<string | null>(null);
    const [wizardAccountEmail, setWizardAccountEmail] = useState<string>('');


    useEffect(() => {
        fetchGoogleStatus();
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('oauth') === 'success') {
            fetchGoogleStatus();
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const fetchGoogleStatus = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/google-auth/status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                setGoogleStatus(data);
            }
        } catch (error) {
            console.error('Error fetching Google status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            
            const response = await fetch('/api/google-auth/auth-url', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                
                if (isMobile) {
                    window.location.href = data.url;
                } else {
                    const width = 500;
                    const height = 600;
                    const left = (window.screen.width - width) / 2;
                    const top = (window.screen.height - height) / 2;
                    
                    const popup = window.open(
                        data.url,
                        'Google OAuth',
                        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes,status=no`
                    );
                    
                    const messageHandler = (event: MessageEvent) => {
                        if (event.data.type === 'oauth-success') {
                            popup?.close();
                            fetchGoogleStatus();
                            window.removeEventListener('message', messageHandler);
                        } else if (event.data.type === 'oauth-error') {
                            popup?.close();
                            alert('Error al conectar con Google. Por favor intenta de nuevo.');
                            window.removeEventListener('message', messageHandler);
                        }
                    };
                    
                    window.addEventListener('message', messageHandler);
                    
                    const checkPopup = setInterval(() => {
                        if (popup?.closed) {
                            clearInterval(checkPopup);
                            window.removeEventListener('message', messageHandler);
                            fetchGoogleStatus();
                        }
                    }, 1000);
                }
            } else {
                const errorData = await response.text();
                console.error('Error response:', errorData);
                throw new Error(`Failed to get authorization URL: ${response.status}`);
            }
        } catch (error) {
            console.error('Error connecting to Google:', error);
            alert('Error al conectar con Google. Por favor intenta de nuevo.');
        }
    };

    const handleDisconnectGoogle = async (accountId: string) => {
        if (!confirm('¿Estás seguro de que deseas desconectar esta cuenta de Google? Perderás el acceso a Gmail y Calendar para esta cuenta.')) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/google-auth/disconnect/${accountId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (response.ok) {
                fetchGoogleStatus();
            }
        } catch (error) {
            console.error('Error disconnecting Google:', error);
            alert('Error al desconectar la cuenta de Google');
        }
    };

    const handleToggleGmail = async (accountId: string, enabled: boolean) => {
        try {
            if (enabled) {
                const account = googleStatus?.accounts.find(acc => acc.id === accountId);
                if (!account) return;
                
                const accountResponse = await fetch(`/api/email-sync/accounts/${accountId}/discovery`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });

                if (accountResponse.ok) {
                    const discoveryData = await accountResponse.json();
                    if (discoveryData.oldestEmailDate) {
                        setWizardAccountId(accountId);
                        setWizardAccountEmail(account.email);
                        setShowSyncWizard(true);
                        return;
                    }
                }
            }

            const token = localStorage.getItem('accessToken');
            const endpoint = enabled ? '/api/google-auth/sync/gmail/enable' : '/api/google-auth/sync/gmail/disable';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountId }),
            });
            
            if (response.ok) {
                fetchGoogleStatus();
            }
        } catch (error) {
            console.error('Error toggling Gmail sync:', error);
            alert('Error al cambiar la sincronización de Gmail');
        }
    };

    const handleWizardComplete = async () => {
        setShowSyncWizard(false);
        if (wizardAccountId) {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/google-auth/sync/gmail/enable', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountId: wizardAccountId }),
            });
            
            if (response.ok) {
                fetchGoogleStatus();
            }
        }
        setWizardAccountId(null);
        setWizardAccountEmail('');
    };

    const handleWizardCancel = () => {
        setShowSyncWizard(false);
        setWizardAccountId(null);
        setWizardAccountEmail('');
    };

    const handleToggleCalendar = async (accountId: string, enabled: boolean) => {
        try {
            const token = localStorage.getItem('accessToken');
            const endpoint = enabled ? '/api/google-auth/sync/calendar/enable' : '/api/google-auth/sync/calendar/disable';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountId }),
            });
            
            if (response.ok) {
                if (enabled) {
                    const syncResponse = await fetch('/api/google-calendar/sync-from-google', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ accountId }),
                    });
                    
                    if (syncResponse.ok) {
                        const result = await syncResponse.json();
                        console.log('Calendar synced:', result);
                    }
                }
                fetchGoogleStatus();
            }
        } catch (error) {
            console.error('Error toggling Calendar sync:', error);
            alert('Error al cambiar la sincronización de Calendar');
        }
    };

    const isGoogleConnected = googleStatus?.connected || false;
    const accountCount = googleStatus?.accounts?.length || 0;

    return (
        <>
            
            <div className="animate-fade-in space-y-8">
                <Banner
                    title="Integrations & Connected Apps"
                    description="Connect your favorite tools to streamline your workflow. Link your Google account to sync emails and calendar events automatically."
                    icon={LinkIcon}
                />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <IntegrationSection title="Available Integrations">
                        <HubCard 
                            title="Gmail"
                            description="Sync emails from your Google account."
                            icon={GmailIcon}
                            isConnected={accountCount}
                            isLoading={loading}
                            onClick={handleConnectGoogle}
                        />
                        <HubCard 
                            title="Google Calendar"
                            description="Sync events from your Google Calendar."
                            icon={GoogleCalendarIcon}
                            isConnected={accountCount}
                            isLoading={loading}
                            onClick={handleConnectGoogle}
                        />
                    </IntegrationSection>
                </div>
                
                <div className="lg:col-span-2">
                    <IntegrationSection title="Connected Accounts">
                        {isGoogleConnected && googleStatus?.accounts && googleStatus.accounts.length > 0 ? (
                            <div className="space-y-4">
                                {googleStatus.accounts.map((account) => (
                                    <ConnectedGoogleAccount 
                                        key={account.id}
                                        account={account}
                                        onDisconnect={handleDisconnectGoogle}
                                        onToggleGmail={handleToggleGmail}
                                        onToggleCalendar={handleToggleCalendar}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-xl py-16 flex flex-col items-center justify-center">
                                <div className="bg-slate-200/70 rounded-full p-4 mb-4">
                                    <LinkIcon className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-md font-semibold text-slate-800">No accounts connected.</h3>
                                <p className="mt-1 text-sm text-slate-500 max-w-xs">
                                    Connect Gmail or Google Calendar to get started.
                                </p>
                            </div>
                        )}
                    </IntegrationSection>
                </div>
            </div>
        </div>

        {showSyncWizard && wizardAccountId && (
            <EmailSyncWizard
                accountId={wizardAccountId}
                accountEmail={wizardAccountEmail}
                onComplete={handleWizardComplete}
                onCancel={handleWizardCancel}
            />
        )}
        </>
    );
};

export default IntegrationsPage;
