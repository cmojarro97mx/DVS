import React, { useState, useEffect } from 'react';
import { EmailAccount } from './DashboardPage';
import { GmailIcon } from './icons/GmailIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { MailIcon } from './icons/MailIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';

interface AccountSetupWizardProps {
  onSave: (accountData: Omit<EmailAccount, 'id' | 'status'>, id?: string) => void;
  onCancel: () => void;
  accountToEdit?: EmailAccount | null;
}

const GSuiteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M21.8 9.3c0-.6-.05-1.19-.15-1.76H12.2v3.33h5.38c-.23 1.08-.88 2.01-1.82 2.65v2.16h2.77c1.62-1.5 2.56-3.7 2.56-6.38z" fill="#4285F4"/>
        <path d="M12.2 22c2.6 0 4.79-.86 6.38-2.34l-2.77-2.16c-.86.58-1.97.92-3.61.92-2.77 0-5.12-1.87-5.96-4.38H3.47v2.24C5.05 20.09 8.37 22 12.2 22z" fill="#34A853"/>
        <path d="M6.24 14.04c-.16-.48-.24-.99-.24-1.5s.08-1.02.24-1.5V8.8H3.47C2.55 10.68 2 12.86 2 15.2c0 2.34.55 4.52 1.47 6.4v-2.24l2.77-2.32z" fill="#FBBC05"/>
        <path d="M12.2 5.98c1.41 0 2.68.49 3.68 1.44l2.45-2.45C16.98 3.52 14.8 2.5 12.2 2.5 8.37 2.5 5.05 4.91 3.47 7.2L6.24 9.44c.84-2.5 3.19-4.38 5.96-4.38z" fill="#EA4335"/>
    </svg>
);

const ProviderButton: React.FC<{ onClick: () => void; icon: React.ElementType; label: string }> = ({ onClick, icon: Icon, label }) => (
    <button
        type="button"
        onClick={onClick}
        className="group w-full flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
        <Icon className="w-8 h-8" />
        <span className="font-semibold text-gray-700 ml-4">{label}</span>
        <ChevronRightIcon className="w-5 h-5 ml-auto text-gray-400 group-hover:text-blue-500 transition-colors" />
    </button>
);

const getProviderIcon = (provider: 'gmail' | 'gsuite' | 'other') => {
    const iconProps = { className: "w-7 h-7" };
    switch (provider) {
        case 'gmail':
            return <GmailIcon {...iconProps} />;
        case 'gsuite':
            return <GSuiteIcon {...iconProps} />;
        case 'other':
            return <MailIcon {...iconProps} />;
        default:
            return null;
    }
};

const AccountSetupWizard: React.FC<AccountSetupWizardProps> = ({ onSave, onCancel, accountToEdit }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Removed 'outlook' from provider type to match EmailAccount type
  const [provider, setProvider] = useState<'gmail' | 'gsuite' | 'other' | null>(null);
  const [showManualConfig, setShowManualConfig] = useState(false);
  const [manualConfig, setManualConfig] = useState({ smtpHost: '', smtpPort: 587, imapHost: '', imapPort: 993 });

  useEffect(() => {
    if (accountToEdit) {
      setStep(2);
      setEmail(accountToEdit.email);
      setProvider(accountToEdit.provider);
      setPassword(''); // For security, don't pre-fill password
      setManualConfig({
        smtpHost: accountToEdit.smtpHost || '',
        smtpPort: accountToEdit.smtpPort || 587,
        imapHost: accountToEdit.imapHost || '',
        imapPort: accountToEdit.imapPort || 993
      });
      if(accountToEdit.provider === 'other') {
          setShowManualConfig(true);
      }
    } else {
      setStep(1);
      setEmail('');
      setPassword('');
      setProvider(null);
      setShowManualConfig(false);
      setManualConfig({ smtpHost: '', smtpPort: 587, imapHost: '', imapPort: 993 });
    }
  }, [accountToEdit]);


  // Removed 'outlook' from provider type to match EmailAccount type
  const handleProviderSelect = (selectedProvider: 'gmail' | 'gsuite' | 'other') => {
    setProvider(selectedProvider);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    onSave({
      email,
      password,
      provider,
      ... (provider === 'other' && showManualConfig ? manualConfig : {})
    }, accountToEdit?.id);
  };

  const goBack = () => {
    if (accountToEdit) {
        onCancel(); // If editing, back goes to the account list
    } else {
        setStep(1); // If creating, back goes to provider selection
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 max-w-2xl mx-auto animate-fade-in shadow-sm">
      <form onSubmit={handleSubmit}>
        {step === 1 && !accountToEdit && (
           <div>
                <h2 className="text-2xl font-bold text-gray-800 text-center">Connect a new account</h2>
                <p className="text-gray-500 text-center mt-2 mb-8">Choose your email provider to get started.</p>
                <div className="flex flex-col gap-4">
                    <ProviderButton onClick={() => handleProviderSelect('gmail')} icon={GmailIcon} label="Gmail" />
                    <ProviderButton onClick={() => handleProviderSelect('gsuite')} icon={GSuiteIcon} label="G Suite" />
                    <ProviderButton onClick={() => handleProviderSelect('other')} icon={MailIcon} label="Other (IMAP)" />
                </div>
            </div>
        )}
        {step === 2 && provider && (
           <div>
            <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={goBack} className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-200">
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                {getProviderIcon(provider)}
                <h3 className="text-lg font-semibold text-gray-800">
                    {/* Removed 'Outlook' from title */}
                    {accountToEdit ? 'Edit' : 'Connect'} your {provider === 'gmail' ? 'Gmail' : provider === 'gsuite' ? 'G Suite' : 'IMAP'} account
                </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value.replace(/\s/g, ''))} 
                  required 
                  placeholder={accountToEdit ? 'Enter new password to update' : ''} 
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
                 <p className="mt-2 text-xs text-gray-500 flex items-start gap-1.5"><ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" /> Your password is encrypted and stored securely. We only use it to connect to your mailbox.</p>
              </div>
              {provider === 'other' && (
                <div>
                  <button type="button" onClick={() => setShowManualConfig(!showManualConfig)} className="text-sm text-blue-600 hover:underline">
                    {showManualConfig ? 'Hide' : 'Show'} manual server configuration
                  </button>
                  {showManualConfig && (
                    <div className="mt-4 space-y-4 p-4 bg-gray-100 rounded-md border">
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">IMAP Host</label>
                                <input type="text" value={manualConfig.imapHost} onChange={e => setManualConfig(c => ({...c, imapHost: e.target.value}))} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900" />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">IMAP Port</label>
                                <input type="number" value={manualConfig.imapPort} onChange={e => setManualConfig(c => ({...c, imapPort: parseInt(e.target.value)}))} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 [color-scheme:light]" />
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                                <input type="text" value={manualConfig.smtpHost} onChange={e => setManualConfig(c => ({...c, smtpHost: e.target.value}))} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900" />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                                <input type="number" value={manualConfig.smtpPort} onChange={e => setManualConfig(c => ({...c, smtpPort: parseInt(e.target.value)}))} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 [color-scheme:light]" />
                             </div>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
              <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                {accountToEdit ? 'Save Changes' : 'Connect Account'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AccountSetupWizard;
