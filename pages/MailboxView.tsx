import React, { useState, useMemo, useEffect } from 'react';
import { EmailAccount, EmailMessage } from './DashboardPage';
import { PencilSquareIcon } from '../components/icons/PencilSquareIcon';
import { InboxIcon } from '../components/icons/InboxIcon';
import { PaperAirplaneIcon } from '../components/icons/PaperAirplaneIcon';
import { FolderIcon } from '../components/icons/FolderIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EmailAvatar } from '../components/EmailAvatar';
import { ReplyIcon } from '../components/icons/ReplyIcon';
import { ReplyAllIcon } from '../components/icons/ReplyAllIcon';
import { ForwardIcon } from '../components/icons/ForwardIcon';
import { PaperClipIcon } from '../components/icons/PaperClipIcon';
import ComposeEmailView from '../components/ComposeEmailView';
import CreateFolderModal from '../components/CreateFolderModal';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';


interface MailboxViewProps {
  accounts: EmailAccount[];
  selectedAccount: EmailAccount;
  onAccountSelect: (account: EmailAccount) => void;
  emails: EmailMessage[];
  onBack: () => void;
  onSendEmail: (email: Omit<EmailMessage, 'id' | 'threadId' | 'unread' | 'snippet' | 'starred'>) => void;
  onAddNewAccount: () => void;
}

const MailboxView: React.FC<MailboxViewProps> = ({ accounts, selectedAccount, onAccountSelect, emails, onBack, onSendEmail, onAddNewAccount }) => {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [composeState, setComposeState] = useState<{ type: 'new' | 'reply' | 'replyAll' | 'forward', originalEmail?: EmailMessage | null } | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  const filteredEmails = useMemo(() => {
    return emails
      .filter(e => e.folder.toLowerCase() === activeFolder.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [emails, activeFolder]);

  const selectedEmail = useMemo(() => {
    return emails.find(e => e.id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

  useEffect(() => {
    if (filteredEmails.length > 0 && !selectedEmailId) {
      setSelectedEmailId(filteredEmails[0].id);
    } else if (filteredEmails.length === 0) {
      setSelectedEmailId(null);
    }
  }, [filteredEmails, selectedEmailId]);

  useEffect(() => {
    // When account changes, reset folder and selection
    setActiveFolder('inbox');
    setSelectedEmailId(null);
  }, [selectedAccount]);

  const handleCreateFolder = (folderName: string) => {
    if (!customFolders.includes(folderName)) {
      setCustomFolders(prev => [...prev, folderName]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="flex-grow flex min-h-0">
        {/* --- FOLDERS PANE --- */}
        <nav className="w-64 bg-slate-50 p-3 border-r border-slate-200 flex-shrink-0 overflow-y-auto flex flex-col">
          <div className="p-3">
            <button
                onClick={() => setComposeState({ type: 'new' })}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg text-sm font-semibold h-11 hover:bg-red-700 shadow-md hover:shadow-lg transition-all duration-300"
                aria-label="Compose new email"
            >
                <PencilSquareIcon className="w-5 h-5" />
                <span>Compose</span>
            </button>
          </div>
          <div className="flex-grow">
            <ul className="space-y-1 p-2">
                <li><button onClick={() => setActiveFolder('inbox')} className={`w-full flex items-center p-2 rounded-md text-sm font-medium ${activeFolder === 'inbox' ? 'bg-red-100 text-red-700' : 'text-slate-600 hover:bg-slate-200'}`}><InboxIcon className="w-5 h-5 mr-3 text-slate-500" /> Inbox</button></li>
                <li><button onClick={() => setActiveFolder('sent')} className={`w-full flex items-center p-2 rounded-md text-sm font-medium ${activeFolder === 'sent' ? 'bg-red-100 text-red-700' : 'text-slate-600 hover:bg-slate-200'}`}><PaperAirplaneIcon className="w-5 h-5 mr-3 text-slate-500" /> Sent</button></li>
                <li><button onClick={() => setActiveFolder('trash')} className={`w-full flex items-center p-2 rounded-md text-sm font-medium ${activeFolder === 'trash' ? 'bg-red-100 text-red-700' : 'text-slate-600 hover:bg-slate-200'}`}><TrashIcon className="w-5 h-5 mr-3 text-slate-500" /> Trash</button></li>
            </ul>
            <div className="mt-4 p-2">
                <div className="flex justify-between items-center px-2 mb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">Folders</h3>
                <button onClick={() => setIsFolderModalOpen(true)} className="p-1 text-slate-400 hover:text-red-600"><PlusIcon className="w-4 h-4" /></button>
                </div>
                <ul className="space-y-1">
                {customFolders.map(folder => (
                    <li key={folder}><button onClick={() => setActiveFolder(folder)} className={`w-full flex items-center p-2 rounded-md text-sm font-medium ${activeFolder === folder ? 'bg-red-100 text-red-700' : 'text-slate-600 hover:bg-slate-200'}`}><FolderIcon className="w-5 h-5 mr-3 text-slate-500" /> {folder}</button></li>
                ))}
                </ul>
            </div>
          </div>
           {/* Account Switcher */}
            <div className="p-2 border-t border-slate-200 mt-auto">
                <div className="group relative">
                    <button className="w-full text-left p-2 rounded-lg hover:bg-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <EmailAvatar name={selectedAccount.email} />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{selectedAccount.email}</p>
                                <p className="text-xs text-green-600">Connected</p>
                            </div>
                        </div>
                        <ChevronDownIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    </button>
                    <div className="absolute bottom-full mb-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-10 hidden group-hover:block">
                        {accounts.map(acc => (
                            <button key={acc.id} onClick={() => onAccountSelect(acc)} className="w-full text-left p-2 rounded-md hover:bg-slate-100 text-sm text-slate-800">{acc.email}</button>
                        ))}
                        <div className="border-t border-slate-200 my-1"></div>
                        <button onClick={onAddNewAccount} className="w-full flex items-center gap-2 text-left p-2 rounded-md hover:bg-slate-100 text-sm text-red-600 font-medium">
                            <PlusCircleIcon className="w-5 h-5"/> Add Account
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        {/* --- EMAIL LIST PANE --- */}
        <aside className="w-[35%] border-r border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-2 border-b border-slate-200"><input type="search" placeholder="Search mail..." className="w-full bg-slate-100 border-transparent rounded-md px-3 py-1.5 text-sm focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400" /></div>
          <ul className="flex-grow overflow-y-auto">
            {filteredEmails.map(email => (
              <li key={email.id}>
                <div onClick={() => setSelectedEmailId(email.id)} className={`w-full text-left p-3 border-b border-l-4 cursor-pointer ${selectedEmailId === email.id ? 'bg-red-50 border-red-600' : 'border-transparent hover:bg-slate-50'}`}>
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2">
                       {email.unread && <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse"></div>}
                       <p className={`font-semibold text-sm truncate ${email.unread ? 'text-slate-900' : 'text-slate-600'}`}>{email.fromName}</p>
                    </div>
                    <time className={`text-xs flex-shrink-0 ${email.unread ? 'text-red-600 font-medium' : 'text-slate-500'}`}>{new Date(email.date).toLocaleDateString()}</time>
                  </div>
                  <p className={`text-sm mt-0.5 truncate ${email.unread ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{email.subject}</p>
                  <p className="text-xs text-slate-500 mt-1 truncate">{email.snippet}</p>
                </div>
              </li>
            ))}
             {filteredEmails.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No emails in {activeFolder}.</div>}
          </ul>
        </aside>

        {/* --- EMAIL DETAIL / COMPOSE PANE --- */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          {composeState ? (
                <ComposeEmailView
                    accountId={selectedAccount.id}
                    onClose={() => setComposeState(null)}
                    type={composeState.type}
                    originalEmail={composeState.originalEmail}
                    fromAddress={selectedAccount.email}
                    onSend={onSendEmail}
                />
          ) : selectedEmail ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-200 flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-slate-800 truncate pr-4">{selectedEmail.subject}</h1>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setComposeState({ type: 'reply', originalEmail: selectedEmail })} className="p-2 rounded-lg hover:bg-slate-100" title="Reply"><ReplyIcon className="w-5 h-5 text-slate-600" /></button>
                        <button onClick={() => setComposeState({ type: 'replyAll', originalEmail: selectedEmail })} className="p-2 rounded-lg hover:bg-slate-100" title="Reply All"><ReplyAllIcon className="w-5 h-5 text-slate-600" /></button>
                        <button onClick={() => setComposeState({ type: 'forward', originalEmail: selectedEmail })} className="p-2 rounded-lg hover:bg-slate-100" title="Forward"><ForwardIcon className="w-5 h-5 text-slate-600" /></button>
                         <button className="p-2 rounded-lg hover:bg-slate-100" title="Delete"><TrashIcon className="w-5 h-5 text-slate-600" /></button>
                    </div>
                </div>
                <div className="flex items-center">
                  <EmailAvatar name={selectedEmail.fromName} />
                  <div className="ml-3 text-sm">
                    <p className="font-semibold text-slate-800">{selectedEmail.fromName} <span className="text-slate-500 font-normal">&lt;{selectedEmail.from}&gt;</span></p>
                    <p className="text-slate-500">To: {selectedEmail.to.join(', ')}</p>
                  </div>
                  <time className="ml-auto text-xs text-slate-500">{new Date(selectedEmail.date).toLocaleString()}</time>
                </div>
              </div>

              <div className="p-6 flex-grow overflow-y-auto whitespace-pre-wrap text-slate-800">{selectedEmail.body}</div>

              {selectedEmail.attachments.length > 0 && (
                <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-slate-50/70">
                  <h4 className="text-sm font-semibold text-slate-800 mb-2">Attachments ({selectedEmail.attachments.length})</h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedEmail.attachments.map((att, index) => (
                      <a key={index} href={att.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-sm hover:bg-slate-100 hover:border-slate-300">
                        <PaperClipIcon className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-800">{att.filename}</span>
                        <span className="text-slate-500">({att.size})</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-slate-500">
              <div>
                <InboxIcon className="w-16 h-16 text-slate-300 mx-auto" />
                <p className="mt-2 font-semibold">Select an email to read</p>
                <p className="text-xs">Nothing selected</p>
              </div>
            </div>
          )}
        </main>
      </div>
      
      <CreateFolderModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} onCreate={handleCreateFolder} />
    </div>
  );
};

export default MailboxView;
