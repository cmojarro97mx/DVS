import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon } from '../components/icons/PlusIcon';
import { GmailIcon } from '../components/icons/GmailIcon';
import { OutlookIcon } from '../components/icons/OutlookIcon';
import { MailIcon } from '../components/icons/MailIcon';
import { EllipsisVerticalIcon } from '../components/icons/EllipsisVerticalIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { EmailAccount } from './DashboardPage';
import { Banner } from '../components/Banner';

// Local icon to avoid creating new files
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
);


interface EmailAccountsManagerProps {
    accounts: EmailAccount[];
    onSelectAccount: (account: EmailAccount) => void;
    onShowSetup: () => void;
    onEditAccount: (account: EmailAccount) => void;
    onDeleteAccount: (account: EmailAccount) => void;
    children?: React.ReactNode;
}

const GSuiteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M21.8 9.3c0-.6-.05-1.19-.15-1.76H12.2v3.33h5.38c-.23 1.08-.88 2.01-1.82 2.65v2.16h2.77c1.62-1.5 2.56-3.7 2.56-6.38z" fill="#4285F4"/>
        <path d="M12.2 22c2.6 0 4.79-.86 6.38-2.34l-2.77-2.16c-.86.58-1.97.92-3.61.92-2.77 0-5.12-1.87-5.96-4.38H3.47v2.24C5.05 20.09 8.37 22 12.2 22z" fill="#34A853"/>
        <path d="M6.24 14.04c-.16-.48-.24-.99-.24-1.5s.08-1.02.24-1.5V8.8H3.47C2.55 10.68 2 12.86 2 15.2c0 2.34.55 4.52 1.47 6.4v-2.24l2.77-2.32z" fill="#FBBC05"/>
        <path d="M12.2 5.98c1.41 0 2.68.49 3.68 1.44l2.45-2.45C16.98 3.52 14.8 2.5 12.2 2.5 8.37 2.5 5.05 4.91 3.47 7.2L6.24 9.44c.84-2.5 3.19-4.38 5.96-4.38z" fill="#EA4335"/>
    </svg>
);

const ProviderIcon: React.FC<{ provider: EmailAccount['provider'], className?: string }> = ({ provider, className = "w-10 h-10" }) => {
    switch(provider) {
        case 'gmail': return <GmailIcon className={className} />;
        case 'gsuite': return <GSuiteIcon className={className} />;
        default: return <MailIcon className={`${className} text-gray-400`} />;
    }
};

const AccountCard: React.FC<{
    account: EmailAccount;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ account, onSelect, onEdit, onDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const statusInfo = account.status === 'connected'
        ? { text: 'Connected', bg: 'bg-green-100', text_color: 'text-green-800' }
        : { text: 'Error', bg: 'bg-red-100', text_color: 'text-red-800' };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <ProviderIcon provider={account.provider} className="w-11 h-11" />
                    <div>
                        <p className="font-bold text-gray-800 text-base break-all">{account.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{account.provider}</p>
                    </div>
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200/70 transition-colors">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-md py-1 z-10 border border-gray-200 shadow-xl">
                            <button onClick={() => { onEdit(); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <EditIcon className="w-4 h-4 mr-3" /> Edit
                            </button>
                            <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <TrashIcon className="w-4 h-4 mr-3" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="my-4">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusInfo.bg} ${statusInfo.text_color}`}>
                    {statusInfo.text}
                </span>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-200/80">
                <button onClick={onSelect} className="w-full flex justify-between items-center group px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-50/70 rounded-lg hover:bg-blue-100 transition-colors">
                    <span>Open Mailbox</span>
                    <ArrowRightIcon className="w-5 h-5 transform transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};


const EmailAccountsManager: React.FC<EmailAccountsManagerProps> = ({ accounts, onSelectAccount, onShowSetup, onEditAccount, onDeleteAccount }) => {
  return (
    <div className="animate-fade-in space-y-6">
       <Banner
            title="Email Accounts"
            description="Manage your connected email inboxes."
            icon={MailIcon}
        />
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div/>
          <button onClick={onShowSetup} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm hover:shadow-md transition-shadow">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Account
          </button>
        </div>
        
          <div className="mt-6">
            {accounts.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accounts.map((account) => (
                      <AccountCard 
                          key={account.id} 
                          account={account} 
                          onSelect={() => onSelectAccount(account)}
                          onEdit={() => onEditAccount(account)}
                          onDelete={() => onDeleteAccount(account)}
                      />
                  ))}
              </div>
            ) : (
                <div className="text-center bg-gray-50/70 border-2 border-dashed border-gray-200 rounded-xl py-20 flex flex-col items-center justify-center">
                      <div className="bg-gray-200/70 rounded-full p-5 mb-5">
                          <MailIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">No email accounts configured.</h3>
                      <p className="mt-1 text-sm text-gray-500 max-w-xs">Connect your inbox to manage communications directly from the platform.</p>
                      <button onClick={onShowSetup} className="mt-6 flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
                          <PlusIcon className="w-5 h-5 mr-2" />
                          Add your first account
                      </button>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default EmailAccountsManager;