import React, { useState, useEffect } from 'react';
import { EmailAccount, EmailMessage } from './DashboardPage';
import EmailAccountsManager from './EmailAccountsManager';
import AccountSetupWizard from '../components/AccountSetupWizard';
import MailboxView from './MailboxView';
import { initialAccounts } from '../data/dummyData';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface EmailClientPageProps {
    emails: EmailMessage[];
    onSendEmail: (email: Omit<EmailMessage, 'id' | 'threadId' | 'unread' | 'snippet' | 'starred'>) => void;
}

const EmailClientPage: React.FC<EmailClientPageProps> = ({ emails, onSendEmail }) => {
  const [view, setView] = useState<'accounts' | 'setup' | 'mailbox'>('accounts');
  const [accounts, setAccounts] = useState<EmailAccount[]>(initialAccounts);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(accounts.length > 0 ? accounts[0] : null);
  const [accountToEdit, setAccountToEdit] = useState<EmailAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<EmailAccount | null>(null);

  useEffect(() => {
    // This effect should not interfere when the user is in the setup process.
    if (view === 'setup') {
      return;
    }

    if (accounts.length > 0 && view === 'accounts') {
        setSelectedAccount(accounts[0]);
        setView('mailbox');
    } else if (accounts.length === 0 && view !== 'accounts') {
        setView('accounts');
        setSelectedAccount(null);
    }
  }, [accounts, view]);


  const handleSelectAccount = (account: EmailAccount) => {
    setSelectedAccount(account);
    setView('mailbox');
  };

  const handleShowSetup = () => {
    setAccountToEdit(null);
    setView('setup');
  };

  const handleEditAccount = (account: EmailAccount) => {
    setAccountToEdit(account);
    setView('setup');
  };

  const handleDeleteRequest = (account: EmailAccount) => {
    setAccountToDelete(account);
  };

  const handleConfirmDelete = () => {
    if (accountToDelete) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id));
        setAccountToDelete(null);
    }
  };

  const handleSaveAccount = (accountData: Omit<EmailAccount, 'id' | 'status'>, id?: string) => {
     if (id) {
        // Update existing account
        setAccounts(prev => prev.map(acc => 
            acc.id === id 
            ? { ...acc, ...accountData, status: 'connected' } 
            : acc
        ));
    } else {
        // Add new account
        const newAccount: EmailAccount = {
          ...accountData,
          id: `acc-${Date.now()}`,
          status: 'connected', // Mock connection success
        };
        setAccounts(prev => [...prev, newAccount]);
    }
    setView(accounts.length > 0 ? 'mailbox' : 'accounts');
    setAccountToEdit(null);
  };

  const handleCancelSetup = () => {
    setView(accounts.length > 0 ? 'mailbox' : 'accounts');
    setAccountToEdit(null);
  };

  const handleBackToAccounts = () => {
    setSelectedAccount(null);
    setView('accounts');
  };

  if (view === 'setup') {
    return (
        <AccountSetupWizard 
            onSave={handleSaveAccount} 
            onCancel={handleCancelSetup} 
            accountToEdit={accountToEdit}
        />
    )
  }

  if (view === 'mailbox' && selectedAccount) {
    return (
        <MailboxView
            accounts={accounts} 
            selectedAccount={selectedAccount}
            onAccountSelect={handleSelectAccount}
            emails={emails.filter(e => e.accountId === selectedAccount.id)}
            onBack={handleBackToAccounts}
            onSendEmail={onSendEmail}
            onAddNewAccount={handleShowSetup}
        />
    )
  }

  return (
    <div className="h-full">
        <EmailAccountsManager 
            accounts={accounts} 
            onSelectAccount={handleSelectAccount} 
            onShowSetup={handleShowSetup} 
            onEditAccount={handleEditAccount}
            onDeleteAccount={handleDeleteRequest}
        />
      
      <ConfirmationModal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Email Account"
      >
        Are you sure you want to delete the account "{accountToDelete?.email}"? 
        This action cannot be undone.
      </ConfirmationModal>
    </div>
  );
};

export default EmailClientPage;