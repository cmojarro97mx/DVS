import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { EmailMessage } from '../pages/DashboardPage';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';
import { BoldIcon } from './icons/BoldIcon';
import { ItalicIcon } from './icons/ItalicIcon';
import { UnderlineIcon } from './icons/UnderlineIcon';
import { LinkIcon } from './icons/LinkIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { SmileyIcon } from './icons/SmileyIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';


interface ComposeEmailViewProps {
  accountId: string;
  onClose: () => void;
  type: 'new' | 'reply' | 'replyAll' | 'forward';
  originalEmail?: EmailMessage | null;
  fromAddress: string;
  onSend: (email: Omit<EmailMessage, 'id' | 'threadId' | 'unread' | 'snippet' | 'starred'>) => void;
}

const RecipientInput: React.FC<{
  label: string,
  value: string,
  onChange: (value: string) => void,
  onBccClick?: () => void,
  hasBccButton?: boolean,
}> = ({ label, value, onChange, onBccClick, hasBccButton = false }) => (
    <div className="flex items-center gap-4">
        <label className="text-sm text-slate-500 w-10 text-right">{label}</label>
        <input 
            type="text" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            className="flex-grow focus:outline-none text-sm text-slate-900 bg-transparent py-1"
        />
        {hasBccButton && <button type="button" onClick={onBccClick} className="text-sm text-slate-500 hover:text-slate-800 font-medium">Bcc</button>}
    </div>
);

const ToolbarButton: React.FC<{ icon: React.ElementType }> = ({ icon: Icon }) => (
    <button type="button" className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-slate-800 transition-colors">
        <Icon className="w-5 h-5" />
    </button>
);


const ComposeEmailView: React.FC<ComposeEmailViewProps> = ({ accountId, onClose, type = 'new', originalEmail, fromAddress, onSend }) => {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('\n\n--\nNexxio Operations Team');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAttachments([]);
    
    if (type === 'new') {
        setTo('');
        setCc('');
        setBcc('');
        setShowBcc(false);
        setSubject('');
        setBody('\n\n--\nNexxio Operations Team');
        return;
    }
    
    if (originalEmail) {
      let newTo = '';
      let newCc = '';
      let newBcc = '';
      let newSubject = '';
      let newBody = `\n\n\n----- Original Message -----\nFrom: ${originalEmail.fromName || originalEmail.from}\nDate: ${new Date(originalEmail.date).toLocaleString()}\nSubject: ${originalEmail.subject}\nTo: ${originalEmail.to.join(', ')}\n\n${originalEmail.body}`;

      switch (type) {
          case 'reply':
              newTo = originalEmail.from;
              newSubject = originalEmail.subject.startsWith('Re: ') ? originalEmail.subject : `Re: ${originalEmail.subject}`;
              break;
          case 'replyAll':
              newTo = originalEmail.from;
              const ccRecipients = [...new Set([...originalEmail.to, ...(originalEmail.cc || [])])].filter(email => email !== fromAddress && email !== originalEmail.from);
              newCc = ccRecipients.join(', ');
              newSubject = originalEmail.subject.startsWith('Re: ') ? originalEmail.subject : `Re: ${originalEmail.subject}`;
              break;
          case 'forward':
               newSubject = originalEmail.subject.startsWith('Fwd: ') ? originalEmail.subject : `Fwd: ${originalEmail.subject}`;
               newBody = `\n\n\n----- Forwarded Message -----\n${newBody}`;
               break;
          default:
              break;
      }
      setTo(newTo);
      setCc(newCc);
      setBcc(newBcc);
      setSubject(newSubject);
      setBody(newBody);
      setShowBcc(!!newBcc);
    } else {
        setTo(''); setCc(''); setBcc(''); setSubject('');
        setBody('\n\n--\nNexxio Operations Team');
        setShowBcc(false);
    }
  }, [type, originalEmail, fromAddress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    const emailToSend = {
      accountId: accountId,
      folder: 'sent' as const,
      from: fromAddress,
      fromName: 'Nexxio Operations',
      to: to.split(',').map(s => s.trim()).filter(Boolean),
      cc: cc.split(',').map(s => s.trim()).filter(Boolean),
      bcc: bcc.split(',').map(s => s.trim()).filter(Boolean),
      subject,
      body,
      date: new Date().toISOString(),
      attachments: attachments.map(f => ({
          filename: f.name,
          size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
          url: '#'
      })),
    };
    onSend(emailToSend);
    onClose();
  };

  const titleMap = {
    new: 'New Message',
    reply: 'Reply',
    replyAll: 'Reply All',
    forward: 'Forward',
  };

  return (
    <div className="h-full flex flex-col bg-white">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
            <h3 className="font-bold text-lg text-slate-800">{titleMap[type]}</h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 transition-colors">
                <XIcon className="w-5 h-5 text-slate-500"/>
            </button>
        </div>

        <div className="flex flex-col flex-grow min-h-0">
            <div className="px-5 py-2 border-b border-slate-200">
                <RecipientInput label="To" value={to} onChange={setTo} />
                <div className="border-t border-slate-200 -mx-5 my-1"></div>
                <RecipientInput label="Cc" value={cc} onChange={setCc} onBccClick={() => setShowBcc(!showBcc)} hasBccButton />
                {showBcc && <>
                    <div className="border-t border-slate-200 -mx-5 my-1"></div>
                    <RecipientInput label="Bcc" value={bcc} onChange={setBcc} />
                </>}
            </div>
            <div className="px-5 py-3 border-b border-slate-200">
                <input type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full text-base font-medium text-slate-900 focus:outline-none bg-transparent" />
            </div>
            
            <div className="flex-grow p-5 overflow-y-auto">
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-full text-base text-slate-800 resize-none focus:outline-none bg-transparent"
                />
            </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
             {attachments.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-3 border-b border-slate-200 pb-3">
                    {attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 bg-blue-50 text-blue-800 p-1.5 rounded-lg text-sm border border-blue-200">
                            <span className="font-medium">{file.name}</span>
                            <button onClick={() => removeAttachment(index)} className="text-blue-500 hover:text-red-600">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-0.5">
                    <ToolbarButton icon={BoldIcon} />
                    <ToolbarButton icon={ItalicIcon} />
                    <ToolbarButton icon={UnderlineIcon} />
                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                    <ToolbarButton icon={UndoIcon} />
                    <ToolbarButton icon={RedoIcon} />
                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                    <ToolbarButton icon={ListBulletIcon} />
                    <ToolbarButton icon={LinkIcon} />
                    <ToolbarButton icon={SmileyIcon} />
                    <ToolbarButton icon={PhotoIcon} />
                </div>
                <div className="flex items-center gap-2">
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        title="Attach file"
                    >
                        <PaperClipIcon className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-red-600" title="Discard draft">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleSend} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 flex items-center gap-2">
                        Send
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <input type="file" ref={fileInputRef} multiple onChange={handleFileChange} className="hidden" />
        </div>
    </div>
  );
};

export default ComposeEmailView;