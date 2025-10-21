import React from 'react';
import { Banner } from '../components/Banner';
import { LinkIcon } from '../components/icons/LinkIcon';
import { EmailAccount, View } from './DashboardPage';
import { GmailIcon } from '../components/icons/GmailIcon';
import { GoogleCalendarIcon } from '../components/icons/GoogleCalendarIcon';
import { GSuiteIcon } from '../components/icons/GSuiteIcon';
import { MailIcon } from '../components/icons/MailIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';

interface IntegrationsPageProps {
    setActiveView: (view: View) => void;
    emailAccounts: EmailAccount[];
    onUpdateEmailAccount: (account: EmailAccount) => void;
}

const HubCard: React.FC<{
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    isConnected?: boolean;
}> = ({ title, description, icon: Icon, onClick, isConnected }) => (
    <button
        onClick={onClick}
        disabled={isConnected}
        className="w-full flex items-center p-4 bg-white rounded-xl border border-slate-200 transition-all duration-300 group hover:border-blue-400 hover:bg-blue-50/30 hover:-translate-y-0.5 disabled:bg-slate-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:-translate-y-0"
    >
        <div className={`p-3 rounded-lg border transition-colors ${isConnected ? 'bg-green-50 border-green-200' : 'bg-slate-100 group-hover:bg-blue-50 group-hover:border-blue-200'}`}>
            <Icon className={`w-6 h-6 transition-colors ${isConnected ? 'text-green-600' : 'text-slate-600 group-hover:text-blue-600'}`} />
        </div>
        <div className="ml-4 text-left flex-grow">
            <h3 className={`font-bold transition-colors ${isConnected ? 'text-slate-800' : 'text-slate-800'}`}>{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        {isConnected ? (
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


const ToggleSwitch: React.FC<{ id?: string; enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ id, enabled, onChange }) => (
    <button
        id={id}
        type="button"
        className={`${enabled ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);


const ConnectedAccountItem: React.FC<{ account: EmailAccount, onUpdate: (account: EmailAccount) => void }> = ({ account, onUpdate }) => {
    const ProviderIcon = {
        'gmail': GmailIcon,
        'gsuite': GSuiteIcon,
        'other': MailIcon,
    }[account.provider];

    return (
        <div className="p-4 bg-white transition-colors hover:bg-slate-50/70">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <ProviderIcon className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <span className="font-bold text-base text-slate-800 truncate">{account.email}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                             <div className="w-2 h-2 rounded-full bg-green-500"></div>
                             <span className="text-xs font-semibold text-green-700">Connected</span>
                        </div>
                    </div>
                </div>
                 <button className="text-sm font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">Disconnect</button>
            </div>
            
            <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                    <label htmlFor={`sync-email-${account.id}`} className="flex items-center gap-3 cursor-pointer">
                        <MailIcon className="w-5 h-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Email Sync</span>
                    </label>
                    <ToggleSwitch 
                        id={`sync-email-${account.id}`}
                        enabled={account.syncEmail ?? false} 
                        onChange={() => onUpdate({ ...account, syncEmail: !account.syncEmail })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor={`sync-calendar-${account.id}`} className="flex items-center gap-3 cursor-pointer">
                        <GoogleCalendarIcon className="w-5 h-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Calendar Sync</span>
                    </label>
                    <ToggleSwitch 
                        id={`sync-calendar-${account.id}`}
                        enabled={account.syncCalendar ?? false} 
                        onChange={() => onUpdate({ ...account, syncCalendar: !account.syncCalendar })}
                    />
                </div>
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


const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ setActiveView, emailAccounts, onUpdateEmailAccount }) => {
    const isGoogleConnected = emailAccounts.some(acc => acc.provider === 'gmail' || acc.provider === 'gsuite');

    return (
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
                            onClick={() => {}}
                        />
                        <HubCard 
                            title="Google Calendar"
                            description="Sync events from your Google Calendar."
                            icon={GoogleCalendarIcon}
                            isConnected={isGoogleConnected}
                            onClick={() => {}}
                        />
                    </IntegrationSection>
                </div>
                
                <div className="lg:col-span-2">
                    <IntegrationSection title="Connected Accounts">
                        {emailAccounts.length > 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden max-h-[500px] overflow-y-auto">
                                {emailAccounts.map(account => (
                                    <ConnectedAccountItem key={account.id} account={account} onUpdate={onUpdateEmailAccount} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-xl py-16 flex flex-col items-center justify-center">
                                <div className="bg-slate-200/70 rounded-full p-4 mb-4">
                                    <LinkIcon className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-md font-semibold text-slate-800">No accounts connected.</h3>
                                <p className="mt-1 text-sm text-slate-500 max-w-xs">Connect an integration from the list to see your accounts here.</p>
                            </div>
                        )}
                    </IntegrationSection>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;