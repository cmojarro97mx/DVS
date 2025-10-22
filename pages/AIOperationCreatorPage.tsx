import React, { useState, useEffect, useCallback } from 'react';
import { View, EmailAccount, EmailMessage, Project } from './DashboardPage';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { Banner } from '../components/Banner';
import { CpuChipIcon } from '../components/icons/CpuChipIcon';
import { LinkIcon } from '../components/icons/LinkIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { DocumentArrowUpIcon } from '../components/icons/DocumentArrowUpIcon';
import { ArrowPathIcon } from '../components/icons/ArrowPathIcon';

interface AIOperationCreatorPageProps {
    setActiveView: (view: View) => void;
    emailAccounts: EmailAccount[];
    emails: EmailMessage[];
    projects: Project[];
    onCreateOperation: (projectDetails: Omit<Project, 'id' | 'progress'>, files: any[]) => void;
}

interface LogEntry {
    id: string;
    timestamp: Date;
    emailSubject: string;
    emailFrom: string;
    action: string;
    status: 'Success' | 'Info' | 'Ignored';
    details: string;
    operationId?: string;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button type="button" className={`${enabled ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`} role="switch" aria-checked={enabled} onClick={() => onChange(!enabled)}>
        <span aria-hidden="true" className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
    </button>
);

const AIOperationCreatorPage: React.FC<AIOperationCreatorPageProps> = ({ setActiveView, emailAccounts, emails, projects, onCreateOperation }) => {
    const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);
    const [isAutoCreateEnabled, setIsAutoCreateEnabled] = useState(true);
    const [isAutoUploadEnabled, setIsAutoUploadEnabled] = useState(true);
    const [isAutoFollowUpEnabled, setIsAutoFollowUpEnabled] = useState(false);
    const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const runSimulation = useCallback(() => {
        if (!isAutomationEnabled) {
            setActivityLog(prev => [{ id: `log-${Date.now()}`, timestamp: new Date(), emailFrom: 'System', emailSubject: 'Automation Disabled', action: 'Scan skipped', status: 'Ignored', details: 'The AI agent is currently disabled.' }, ...prev]);
            return;
        }

        setIsProcessing(true);
        setActivityLog([]);
        let logBuffer: LogEntry[] = [];

        const processEmail = (email: EmailMessage, index: number) => {
            setTimeout(() => {
                let logEntry: LogEntry | null = null;
                const emailSubjectLower = email.subject.toLowerCase();
                const projectExists = projects.some(p => email.subject.includes(p.id));

                if (isAutoCreateEnabled && !projectExists && (emailSubjectLower.includes('quotation') || emailSubjectLower.includes('new shipment'))) {
                    const newProject: Omit<Project, 'id' | 'progress'> = {
                        projectName: `AI: ${email.subject}`, projectCategory: 'Air Freight',
                        startDate: new Date().toISOString().split('T')[0], deadline: '', status: 'Planning',
                        assignees: [], currency: 'USD', clientId: 'client-1', operationType: 'Air Freight',
                        insurance: 'Not Insured', shippingMode: 'Air Freight', courrier: 'To Be Confirmed',
                        bookingTracking: '', etd: '', eta: '', pickupDate: '',
                        pickupAddress: 'Parsed from email', deliveryAddress: 'Parsed from email',
                        mbl_awb: '', hbl_awb: '', notes: `Created automatically from email by ${email.fromName}.`,
                    };
                    onCreateOperation(newProject, []);
                    logEntry = { id: email.id, timestamp: new Date(), emailFrom: email.fromName, emailSubject: email.subject, action: 'Create Operation', status: 'Success', details: `New operation created based on email subject.`, operationId: `OP-...` };
                } else if (isAutoUploadEnabled && projectExists && email.attachments.length > 0) {
                    const opId = projects.find(p => email.subject.includes(p.id))?.id;
                    logEntry = { id: email.id, timestamp: new Date(), emailFrom: email.fromName, emailSubject: email.subject, action: 'Attach Document', status: 'Success', details: `Document "${email.attachments[0].filename}" linked to operation ${opId}.`, operationId: opId };
                } else {
                    logEntry = { id: email.id, timestamp: new Date(), emailFrom: email.fromName, emailSubject: email.subject, action: 'Scan Email', status: 'Info', details: 'No actionable items found or conditions not met.' };
                }
                
                if (logEntry) {
                    logBuffer.unshift(logEntry);
                    setActivityLog([...logBuffer]);
                }

                if (index === emails.length - 1) {
                    setIsProcessing(false);
                }
            }, index * 300);
        };

        emails.forEach(processEmail);
    }, [isAutomationEnabled, isAutoCreateEnabled, isAutoUploadEnabled, emails, projects, onCreateOperation]);

    if (emailAccounts.length === 0) {
        return (
            <div className="animate-fade-in text-center flex flex-col items-center justify-center h-full bg-white rounded-xl border border-gray-200 p-8">
                <div className="bg-slate-100 rounded-full p-5"><LinkIcon className="w-12 h-12 text-slate-400" /></div>
                <h3 className="mt-6 text-xl font-bold text-slate-800">No Email Accounts Connected</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-sm">To use the AI Operation Creator, you must first connect an active email account.</p>
                <button onClick={() => setActiveView('integrations')} className="mt-6 flex items-center bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                    Go to Integrations
                </button>
            </div>
        );
    }

    const LogIcon: React.FC<{ status: LogEntry['status'] }> = ({ status }) => {
        switch (status) {
            case 'Success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'Ignored': return <XCircleIcon className="w-5 h-5 text-gray-400" />;
            case 'Info': default: return <PlusCircleIcon className="w-5 h-5 text-blue-500" />;
        }
    };
    
    return (
        <div className="animate-fade-in space-y-6">
            <button onClick={() => setActiveView('email-hub')} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeftIcon className="w-4 h-4 mr-2" /> Volver a Email & Calendario</button>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">AI Operation Creator</h2>
                        <p className="text-gray-500 mt-1">Automatically create and manage operations from your emails.</p>
                    </div>
                     <button onClick={runSimulation} disabled={isProcessing} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait">
                        {isProcessing ? <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> : <CpuChipIcon className="w-5 h-5 mr-2" />}
                        {isProcessing ? 'Processing...' : 'Run Email Scan'}
                    </button>
                </div>
                
                <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                        <label className="font-semibold text-slate-700">Agent Status</label>
                        <ToggleSwitch enabled={isAutomationEnabled} onChange={setIsAutomationEnabled} />
                    </div>
                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                        <label className="font-semibold text-slate-700">Auto-Create Operations</label>
                        <ToggleSwitch enabled={isAutoCreateEnabled} onChange={setIsAutoCreateEnabled} />
                    </div>
                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                        <label className="font-semibold text-slate-700">Auto-Upload Documents</label>
                        <ToggleSwitch enabled={isAutoUploadEnabled} onChange={setIsAutoUploadEnabled} />
                    </div>
                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border opacity-60">
                        <label className="font-semibold text-slate-500">Auto-Track Shipments</label>
                        <ToggleSwitch enabled={isAutoFollowUpEnabled} onChange={setIsAutoFollowUpEnabled} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">Live Activity Log</h3>
                 <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 -mr-2">
                    {activityLog.length > 0 ? activityLog.map(log => (
                        <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-4">
                            <div className="mt-1"><LogIcon status={log.status} /></div>
                            <div className="flex-grow">
                                <p className="font-semibold text-slate-800 text-sm">{log.action}: <span className="font-normal text-slate-600">{log.emailSubject}</span></p>
                                <p className="text-xs text-slate-500">From: {log.emailFrom} | Status: {log.status}</p>
                                <p className="text-xs text-slate-600 mt-1 italic">"{log.details}"</p>
                            </div>
                             <time className="text-xs text-slate-400 flex-shrink-0 mt-1">{log.timestamp.toLocaleTimeString()}</time>
                        </div>
                    )) : (
                        <div className="text-center py-16 text-slate-500"><p>Click "Run Email Scan" to see the AI agent's activity.</p></div>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default AIOperationCreatorPage;
