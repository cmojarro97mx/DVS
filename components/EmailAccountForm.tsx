import React, { useState } from 'react';
// Import EmailAccount from the correct source file where it is defined.
import { EmailAccount } from '../pages/DashboardPage';

interface EmailAccountFormProps {
  onSave: (account: EmailAccount) => void;
  onCancel: () => void;
}

const EmailAccountForm: React.FC<EmailAccountFormProps> = ({ onSave, onCancel }) => {
  const [email, setEmail] = useState('');
  // Changed type to be compatible with EmailAccount.provider
  const [provider, setProvider] = useState<'gmail' | 'gsuite' | 'other'>('gmail');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Email is required');
      return;
    }
    const newAccount: EmailAccount = {
      id: `acc-${Date.now()}`,
      email,
      provider,
      status: 'connected', // Mock connection success
    };
    onSave(newAccount);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Connect Email Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700">Email Provider</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'gmail' | 'gsuite' | 'other')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="gmail">Gmail</option>
            {/* Replaced 'outlook' with 'gsuite' to match EmailAccount.provider type */}
            <option value="gsuite">G Suite</option>
            <option value="other">Other (IMAP/SMTP)</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            Connect
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailAccountForm;
