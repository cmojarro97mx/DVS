import React, { useState, useEffect } from 'react';
import { Banner } from '../components/Banner';
import { LinkIcon } from '../components/icons/LinkIcon';
import { View } from './DashboardPage';
import { GmailIcon } from '../components/icons/GmailIcon';
import { GoogleCalendarIcon } from '../components/icons/GoogleCalendarIcon';
import { GSuiteIcon } from '../components/icons/GSuiteIcon';
import { MailIcon } from '../components/icons/MailIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';

interface IntegrationsPageProps {
    setActiveView: (view: View) => void;
}

interface GoogleConnectionStatus {
    connected: boolean;
    hasRefreshToken: boolean;
    tokenExpiry: string | null;
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
        disabled={isConnected || isLoading}
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
        ) : isConnected ? (
             <div className="flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                <CheckCircleIcon className="w-4 h-4"/>
                Connected
            </div>
        ) : (
            <div className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full border border-slate-200 group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                Connect
            </div>
        )}
    </button>
);

const ConnectedGoogleAccount: React.FC<{ 
    status: GoogleConnectionStatus;
    onDisconnect: () => void; 
}> = ({ status, onDisconnect }) => {
    return (
        <div className="p-6 bg-white transition-colors hover:bg-slate-50/70 rounded-xl border border-slate-200">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <GSuiteIcon className="w-10 h-10 flex-shrink-0" />
                    <div>
                        <span className="font-bold text-lg text-slate-800">Google Workspace</span>
                        <div className="flex items-center gap-1.5 mt-1">
                             <div className="w-2 h-2 rounded-full bg-green-500"></div>
                             <span className="text-xs font-semibold text-green-700">Connected</span>
                        </div>
                    </div>
                </div>
                 <button 
                    onClick={onDisconnect}
                    className="text-sm font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                >
                    Disconnect
                </button>
            </div>
            
            <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex items-center gap-3">
                    <GmailIcon className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Gmail</span>
                    <CheckCircleIcon className="w-4 h-4 text-green-600 ml-auto" />
                </div>
                <div className="flex items-center gap-3">
                    <GoogleCalendarIcon className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Calendar</span>
                    <CheckCircleIcon className="w-4 h-4 text-green-600 ml-auto" />
                </div>
                {status.tokenExpiry && (
                    <p className="text-xs text-slate-400 mt-3">
                        Token expires: {new Date(status.tokenExpiry).toLocaleString('es-ES')}
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
    const [showOAuthModal, setShowOAuthModal] = useState(false);
    const [oauthUrl, setOauthUrl] = useState('');

    useEffect(() => {
        const styleTag = document.createElement('style');
        styleTag.id = 'modal-styles';
        styleTag.innerHTML = `
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-slide-up {
                animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
        `;
        if (!document.getElementById('modal-styles')) {
            document.head.appendChild(styleTag);
        }
        return () => {
            const tag = document.getElementById('modal-styles');
            if (tag) tag.remove();
        };
    }, []);

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
                
                // Detectar si es móvil
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                
                if (isMobile) {
                    // En móvil, usar redirección completa
                    window.location.href = data.url;
                } else {
                    // En escritorio, mostrar modal
                    setOauthUrl(data.url);
                    setShowOAuthModal(true);
                    
                    // Escuchar mensaje del iframe
                    const messageHandler = (event: MessageEvent) => {
                        if (event.data.type === 'oauth-success') {
                            setShowOAuthModal(false);
                            fetchGoogleStatus();
                            window.removeEventListener('message', messageHandler);
                        } else if (event.data.type === 'oauth-error') {
                            setShowOAuthModal(false);
                            alert('Error al conectar con Google. Por favor intenta de nuevo.');
                            window.removeEventListener('message', messageHandler);
                        }
                    };
                    
                    window.addEventListener('message', messageHandler);
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

    const handleDisconnectGoogle = async () => {
        if (!confirm('¿Estás seguro de que deseas desconectar tu cuenta de Google? Perderás el acceso a Gmail y Calendar.')) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/google-auth/disconnect', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (response.ok) {
                setGoogleStatus({ connected: false, hasRefreshToken: false, tokenExpiry: null });
            }
        } catch (error) {
            console.error('Error disconnecting Google:', error);
            alert('Error al desconectar la cuenta de Google');
        }
    };

    const isGoogleConnected = googleStatus?.connected || false;

    return (
        <>
            {showOAuthModal && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
                    onClick={() => setShowOAuthModal(false)}
                >
                    <div 
                        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[400px] sm:max-w-[480px] overflow-hidden animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                    <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white font-semibold text-sm sm:text-base truncate">Conectar con Google</h3>
                                    <p className="text-white/80 text-xs hidden sm:block">Autoriza el acceso a tu cuenta</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowOAuthModal(false)}
                                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 flex-shrink-0 ml-2"
                                aria-label="Cerrar"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <iframe
                            src={oauthUrl}
                            className="w-full h-[450px] sm:h-[520px] border-0"
                            title="Google OAuth"
                        />
                    </div>
                </div>
            )}
            
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
                            isConnected={isGoogleConnected}
                            isLoading={loading}
                            onClick={handleConnectGoogle}
                        />
                        <HubCard 
                            title="Google Calendar"
                            description="Sync events from your Google Calendar."
                            icon={GoogleCalendarIcon}
                            isConnected={isGoogleConnected}
                            isLoading={loading}
                            onClick={handleConnectGoogle}
                        />
                    </IntegrationSection>
                </div>
                
                <div className="lg:col-span-2">
                    <IntegrationSection title="Connected Accounts">
                        {isGoogleConnected && googleStatus ? (
                            <ConnectedGoogleAccount 
                                status={googleStatus}
                                onDisconnect={handleDisconnectGoogle}
                            />
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
        </>
    );
};

export default IntegrationsPage;
