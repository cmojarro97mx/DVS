import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ReconciliationSession, BankTransaction, SatInvoice } from './DashboardPage';
import { ApiConnectionIcon } from '../components/icons/ApiConnectionIcon';
import { LinkIcon } from '../components/icons/LinkIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { DocumentMagnifyingGlassIcon } from '../components/icons/DocumentMagnifyingGlassIcon';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { XIcon } from '../components/icons/XIcon';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';
import { FolderIcon } from '../components/icons/FolderIcon';
import { CalendarDaysIcon } from '../components/icons/CalendarDaysIcon';
import { mockReceivedInvoices, mockIssuedInvoices, mockBankTransactions } from '../data/dummyData';
import { Banner } from '../components/Banner';

// --- Local Icons (to avoid creating new files) ---
const PdfDownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.5 15.5V13h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1zM9.5 13H8m1.5 0c0-.828-.672-1.5-1.5-1.5H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.5 17.5l-1-5h1.5l1 5h-1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17.5 17.5h-2v-5h2v2.5h-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const XmlDownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="m10.5 11.5-2 2 2 2m3-4 2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const BanknotesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125-1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// --- Interfaces and Mock Data ---
interface BankReconciliationPageProps {
    history: ReconciliationSession[];
    setHistory: React.Dispatch<React.SetStateAction<ReconciliationSession[]>>;
}

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ElementType, small?: boolean }> = ({ title, value, icon: Icon, small = false }) => (
    <div className={`bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3 ${small ? 'flex-col items-start' : ''}`}>
        <div className={`p-2.5 rounded-lg ${small ? 'bg-slate-100' : 'bg-slate-800'}`}>
            <Icon className={`w-5 h-5 ${small ? 'text-slate-600' : 'text-white'}`} />
        </div>
        <div>
            <p className={`font-semibold ${small ? 'text-slate-600 text-xs' : 'text-slate-500 text-sm'}`}>{title}</p>
            <p className={`font-bold ${small ? 'text-slate-900 text-lg' : 'text-slate-800 text-xl'}`}>{value}</p>
        </div>
    </div>
);

const FilterButtons: React.FC<{ filter: string, setFilter: (f: any) => void }> = ({ filter, setFilter }) => (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filter === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>All</button>
        <button onClick={() => setFilter('reconciled')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filter === 'reconciled' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>Reconciled</button>
        <button onClick={() => setFilter('unreconciled')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filter === 'unreconciled' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>Pending</button>
    </div>
);

const BankReconciliationPage: React.FC<BankReconciliationPageProps> = ({ history, setHistory }) => {
    const [rfc, setRfc] = useState('XAXX010101000');
    
    const [mainView, setMainView] = useState<'cfdi' | 'reconciliation' | 'history'>('cfdi');
    const [viewingSession, setViewingSession] = useState<ReconciliationSession | null>(null);

    const [cfdiTab, setCfdiTab] = useState<'issued' | 'received'>('received');
    const [issuedInvoices, setIssuedInvoices] = useState<SatInvoice[]>([]);
    const [receivedInvoices, setReceivedInvoices] = useState<SatInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [cfdiQueryDate, setCfdiQueryDate] = useState(new Date());
    
    // State for active/new reconciliation
    const [reconciliationMonth, setReconciliationMonth] = useState(new Date());
    const [bankStatements, setBankStatements] = useState<File[]>([]);
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [reconciliationMap, setReconciliationMap] = useState<Map<string, string>>(new Map()); // Map<tx.id, invoice.uuid>
    
    const [transactionFilter, setTransactionFilter] = useState<'all' | 'reconciled' | 'unreconciled'>('all');
    const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'reconciled' | 'unreconciled'>('unreconciled');
    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
    const [detailViewTab, setDetailViewTab] = useState<'overview' | 'report'>('overview');
    const [isContinuing, setIsContinuing] = useState<string | null>(null);


    const monthOptions = useMemo(() => {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 4; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            options.push(date);
        }
        return options;
    }, []);

    const fetchInvoices = useCallback((date: Date) => {
        setIsLoading(true);
        return new Promise<void>((resolve) => {
            setTimeout(() => { 
                const filteredReceived = mockReceivedInvoices.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear();
                });
                const filteredIssued = mockIssuedInvoices.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear();
                });
                setReceivedInvoices(filteredReceived);
                setIssuedInvoices(filteredIssued);
                setIsLoading(false); 
                resolve();
            }, 1500);
        });
    }, []);

    useEffect(() => { fetchInvoices(cfdiQueryDate); }, [cfdiQueryDate, fetchInvoices]);
    
    const handlePrevMonth = () => setCfdiQueryDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCfdiQueryDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { setBankStatements(prev => [...prev, ...Array.from(e.target.files!)]); } };
    const removeFile = (index: number) => { setBankStatements(prev => prev.filter((_, i) => i !== index)); };
    
    const resetNewReconciliation = () => {
        setBankStatements([]);
        setTransactions([]);
        setReconciliationMap(new Map());
        setReconciliationMonth(new Date());
    };

    const runReconciliation = async (sessionId: string, transactionsToProcess: BankTransaction[], month: Date) => {
        const relevantInvoices = mockReceivedInvoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate.getMonth() === month.getMonth() && invDate.getFullYear() === month.getFullYear() && inv.status === 'Vigente';
        });
        
        const newMap = new Map<string, string>();
        const totalTx = transactionsToProcess.length;
        const availableInvoices = [...relevantInvoices];
    
        for (let i = 0; i < totalTx; i++) {
            const tx = transactionsToProcess[i];
            
            if (tx.type === 'debit') {
                const matchIndex = availableInvoices.findIndex(inv => inv.total === tx.amount);
                if (matchIndex !== -1) {
                    const matchedInvoice = availableInvoices[matchIndex];
                    newMap.set(tx.id, matchedInvoice.uuid);
                    availableInvoices.splice(matchIndex, 1);
                }
            }
    
            const progressPercentage = ((i + 1) / totalTx) * 100;
            setHistory(prev => prev.map(s => {
                if (s.id === sessionId) {
                    const debitTxCount = s.data.transactions.filter(t => t.type === 'debit').length;
                    const reconciledDebitTxs = Array.from(newMap.keys()).map(txId => s.data.transactions.find(t => t.id === txId)).filter(t => t?.type === 'debit').length;
                    return {
                        ...s,
                        summary: {
                            ...s.summary,
                            reconciledCount: reconciledDebitTxs,
                            unreconciledCount: debitTxCount - reconciledDebitTxs,
                            progressPercentage: progressPercentage,
                        }
                    };
                }
                return s;
            }));
    
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        
        setHistory(prev => prev.map(s => {
            if (s.id === sessionId) {
                const reconciledTxs = s.data.transactions.filter(tx => newMap.has(tx.id));
                const reconciledAmount = reconciledTxs.reduce((sum, tx) => sum + tx.amount, 0);
                const isCompleted = s.summary.reconciledCount === s.summary.totalDebitTransactions;
    
                return {
                    ...s,
                    status: isCompleted ? 'completed' : 'saved',
                    data: { ...s.data, reconciliationMap: newMap },
                    summary: {
                        ...s.summary,
                        progressPercentage: 100,
                        reconciledAmount: reconciledAmount,
                    }
                };
            }
            return s;
        }));
    };

    const startReconciliationProcess = () => {
        const sessionId = `session-${Date.now()}`;
        const transactionsToProcess = mockBankTransactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === reconciliationMonth.getMonth() && txDate.getFullYear() === reconciliationMonth.getFullYear();
        });
        const totalDebitTransactions = transactionsToProcess.filter(tx => tx.type === 'debit').length;

        const newSession: ReconciliationSession = {
            id: sessionId,
            date: new Date(),
            status: 'processing',
            summary: {
                reconciledCount: 0,
                unreconciledCount: totalDebitTransactions,
                totalTransactions: transactionsToProcess.length,
                totalDebitTransactions: totalDebitTransactions,
                progressPercentage: 0,
                reconciledAmount: 0,
            },
            data: {
                transactions: transactionsToProcess,
                reconciliationMap: new Map(),
                bankStatements: bankStatements.map(f => ({ name: f.name, size: f.size })),
                reconciliationMonth: reconciliationMonth,
            }
        };

        setHistory(prev => [newSession, ...prev]);
        setMainView('history');
        runReconciliation(sessionId, transactionsToProcess, reconciliationMonth);
        resetNewReconciliation();
    };
    
    const handleContinueSession = async (session: ReconciliationSession) => {
        setIsContinuing(session.id);
        
        const sessionMonth = new Date(session.data.reconciliationMonth);
        
        // 1. Fetch new data first to get latest invoices for that month.
        await fetchInvoices(sessionMonth);
    
        // 2. Set all state needed for the new view after data is fetched.
        setTransactions(session.data.transactions);
        setReconciliationMap(new Map(session.data.reconciliationMap)); // Use new Map instance
        setReconciliationMonth(sessionMonth);
        setBankStatements([]); // Clear statements from 'new' workflow
        
        // 3. Switch the view and turn off loading state.
        setViewingSession(null);
        setMainView('reconciliation');
        setIsContinuing(null);
    };

    const handleSaveProgress = () => {
        // Here you would normally save to a backend.
        // For this demo, we just go back to the history view.
        setTransactions([]);
        setReconciliationMap(new Map());
        setMainView('history');
    }

    const formatAmount = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ` ${currency}`;
    
    const renderCfdiView = (): React.ReactNode => (
        <div className="space-y-4">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                 <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setCfdiTab('received')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${cfdiTab === 'received' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>Received</button>
                    <button onClick={() => setCfdiTab('issued')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${cfdiTab === 'issued' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>Issued</button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        <button onClick={handlePrevMonth} className="p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-gray-800"><ChevronLeftIcon className="w-5 h-5"/></button>
                        <span className="w-36 text-center font-semibold text-sm text-gray-700 capitalize">{cfdiQueryDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={handleNextMonth} className="p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-gray-800"><ChevronRightIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </header>
            
            {isLoading ? (
                <div className="text-center py-16"><svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="mt-4 text-gray-500">Loading invoices...</p></div>
            ) : (
                <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th scope="col" className="px-4 py-3">UUID</th><th scope="col" className="px-4 py-3">{cfdiTab === 'received' ? 'Issuer' : 'Receiver'}</th><th scope="col" className="px-4 py-3">Date</th><th scope="col" className="px-4 py-3 text-right">Total</th><th scope="col" className="px-4 py-3 text-center">Status</th><th scope="col" className="px-4 py-3 text-center">Downloads</th></tr></thead><tbody>
                    {(cfdiTab === 'received' ? receivedInvoices : issuedInvoices).map(invoice => (<tr key={invoice.uuid} className="bg-white border-b hover:bg-gray-50"><td className="px-4 py-2 font-mono text-xs text-gray-600" title={invoice.uuid}>{invoice.uuid.substring(0, 13)}...</td><td className="px-4 py-2 font-medium text-gray-800">{cfdiTab === 'received' ? invoice.issuerName : invoice.receiverName}</td><td className="px-4 py-2 text-gray-600">{invoice.date}</td><td className="px-4 py-2 text-right font-semibold text-gray-800">{formatAmount(invoice.total, invoice.currency)}</td><td className="px-4 py-2 text-center"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${invoice.status === 'Vigente' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{invoice.status === 'Vigente' ? 'Active' : 'Canceled'}</span></td><td className="px-4 py-2 text-center"><div className="flex items-center justify-center gap-2"><a href={invoice.pdfUrl} download className="p-1 text-red-600 hover:text-red-800"><PdfDownloadIcon className="w-5 h-5"/></a><a href={invoice.xmlUrl} download className="p-1 text-blue-600 hover:text-blue-800"><XmlDownloadIcon className="w-5 h-5"/></a></div></td></tr>))}
                </tbody></table>
                     {(cfdiTab === 'received' ? receivedInvoices : issuedInvoices).length === 0 && (<div className="text-center py-16 text-gray-500 border-t"><DocumentTextIcon className="mx-auto w-12 h-12 text-gray-300"/><h3 className="mt-2 font-semibold">No invoices found</h3><p className="text-sm">There are no {cfdiTab === 'received' ? 'received' : 'issued'} invoices for this period.</p></div>)}
                </div>
            )}
        </div>
    );
    
    const renderHistoryView = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Reconciliation History</h3>
             {history.length > 0 ? history.map(session => {
                const isCompleted = session.status === 'completed';
                const isProcessing = session.status === 'processing';
                 return (
                 <div key={session.id} onClick={() => !isProcessing && setViewingSession(session)} className={`p-4 rounded-xl border-2 grid grid-cols-1 md:grid-cols-4 items-center gap-4 transition-all hover:border-blue-500 hover:bg-blue-50/50 ${isProcessing ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 cursor-pointer'}`}>
                    <div><p className="font-semibold text-gray-800 capitalize">Reconciliation for {new Date(session.data.reconciliationMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p><p className="text-xs text-gray-500">Started: {session.date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
                    <div className="md:col-span-2">{isProcessing ? (<div><div className="flex justify-between items-center mb-1"><p className="text-sm font-semibold text-blue-700">Processing...</p><p className="text-xs font-medium text-blue-600">{Math.round(session.summary.progressPercentage)}%</p></div><div className="w-full bg-blue-100 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${session.summary.progressPercentage}%`}}></div></div><p className="text-xs text-gray-500 mt-1">{session.summary.reconciledCount} of {session.summary.totalDebitTransactions} reconciled.</p></div>) : (<div className="flex items-center gap-4"><div><p className="text-xs text-gray-500">Expenses</p><p className="font-semibold text-base">{session.summary.totalDebitTransactions}</p></div><div><p className="text-xs text-gray-500">Reconciled</p><p className="font-semibold text-base">{session.summary.reconciledCount}</p></div><div><span className={`px-3 py-1 text-xs font-semibold rounded-full ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{isCompleted ? 'Completed' : 'Saved'}</span></div></div>)}</div>
                    <div className="text-right"><button disabled={isProcessing} className="bg-white text-gray-700 border border-gray-300 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">View Details</button></div>
                 </div>
                 );
             }) : (
                <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-lg"><FolderIcon className="mx-auto w-12 h-12 text-gray-300"/><h3 className="mt-2 font-semibold">No history available</h3><p className="text-sm">Start a new reconciliation and save your progress.</p></div>
             )}
        </div>
    );
    
    const renderNewReconciliationSetupView = () => (
        <div className="space-y-8">
             <div><h3 className="text-lg font-semibold text-gray-800 mb-2"><span className="bg-blue-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center text-sm mr-2">1</span> Select the statement month</h3><p className="text-sm text-gray-500 mb-4 ml-8">Indicate which period the documents you are uploading correspond to.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-8">
                {monthOptions.map(month => {
                    const isSelected = month.getFullYear() === reconciliationMonth.getFullYear() && month.getMonth() === reconciliationMonth.getMonth();
                    return (<button key={month.toISOString()} type="button" onClick={() => setReconciliationMonth(month)} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all duration-200 group ${isSelected ? 'bg-blue-100 border-blue-500 shadow-md scale-105' : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}><CalendarDaysIcon className={`w-8 h-8 mb-2 transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} /><span className={`font-bold uppercase text-xs transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{month.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span></button>);
                })}
             </div></div>
            <div><h3 className="text-lg font-semibold text-gray-800 mb-3"><span className="bg-blue-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center text-sm mr-2">2</span> Upload Bank Statements</h3><div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 hover:bg-blue-50 ml-8" onClick={() => document.getElementById('file-upload')?.click()}><div className="space-y-1 text-center"><UploadCloudIcon className="mx-auto h-10 w-10 text-gray-400" /><div className="flex text-sm text-gray-600"><span className="font-medium text-blue-600">Upload PDF files</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept=".pdf" onChange={handleFileChange} /></div></div></div>{bankStatements.length > 0 && <div className="mt-4 space-y-2 text-sm ml-8">{bankStatements.map((f, i) => <div key={i} className="p-2 bg-gray-100 rounded-md border flex items-center justify-between gap-2"><div className="flex items-center gap-2 min-w-0"><DocumentTextIcon className="w-5 h-5 text-gray-500 flex-shrink-0"/><span className="text-gray-800 font-medium truncate" title={f.name}>{f.name}</span></div><button onClick={() => removeFile(i)} className="p-1 text-gray-400 hover:text-red-600 flex-shrink-0"><XIcon className="w-4 h-4"/></button></div>)}</div>}</div>
            <div><h3 className="text-lg font-semibold text-gray-800 mb-3"><span className="bg-blue-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center text-sm mr-2">3</span> Process and Reconcile</h3><p className="text-sm text-gray-500 mb-4 ml-8">The system will look for amount matches between payments and received invoices for the selected month.</p><button onClick={startReconciliationProcess} disabled={bankStatements.length === 0} className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 ml-8">Process Bank Statements</button></div>
        </div>
    );
    
    const renderActiveReconciliationView = () => {
        const reconciliationSummary = useMemo(() => {
            const debitTxs = transactions.filter(tx => tx.type === 'debit');
            const reconciledTxs = debitTxs.filter(tx => reconciliationMap.has(tx.id));
            const reconciledAmount = reconciledTxs.reduce((sum, tx) => sum + tx.amount, 0);
            const pendingInvoices = receivedInvoices.filter(inv => inv.status === 'Vigente' && !Array.from(reconciliationMap.values()).includes(inv.uuid));
            return { totalDebitTransactions: debitTxs.length, reconciledCount: reconciledTxs.length, reconciledAmount, pendingInvoicesCount: pendingInvoices.length, };
        }, [transactions, receivedInvoices, reconciliationMap]);

        const filteredTransactions = useMemo(() => {
            const debitTxs = transactions.filter(tx => tx.type === 'debit');
            if (transactionFilter === 'reconciled') return debitTxs.filter(tx => reconciliationMap.has(tx.id));
            if (transactionFilter === 'unreconciled') return debitTxs.filter(tx => !reconciliationMap.has(tx.id));
            return debitTxs;
        }, [transactions, transactionFilter, reconciliationMap]);
    
        const filteredInvoices = useMemo(() => {
            const validInvoices = receivedInvoices.filter(inv => inv.status === 'Vigente');
            if (invoiceFilter === 'reconciled') return validInvoices.filter(inv => Array.from(reconciliationMap.values()).includes(inv.uuid));
            if (invoiceFilter === 'unreconciled') return validInvoices.filter(inv => !Array.from(reconciliationMap.values()).includes(inv.uuid));
            return validInvoices;
        }, [receivedInvoices, invoiceFilter, reconciliationMap]);

        return (
        <div className="space-y-8">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800">Reconciliation in Progress: <span className="capitalize">{reconciliationMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span></h2><div className="flex items-center gap-2"><button onClick={handleSaveProgress} className="font-semibold text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg">Save Progress</button><button onClick={handleSaveProgress} className="font-semibold text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg">Discard</button></div></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Expense Transactions" value={reconciliationSummary.totalDebitTransactions} icon={DocumentMagnifyingGlassIcon} />
                <StatCard title="Reconciled" value={`${reconciliationSummary.reconciledCount} / ${reconciliationSummary.totalDebitTransactions}`} icon={CheckCircleIcon} />
                <StatCard title="Reconciled Amount" value={formatAmount(reconciliationSummary.reconciledAmount, 'MXN')} icon={BanknotesIcon} />
                <StatCard title="Pending Invoices" value={reconciliationSummary.pendingInvoicesCount} icon={DocumentTextIcon} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
                <div><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-gray-800">Bank Transactions (Expenses)</h3><FilterButtons filter={transactionFilter} setFilter={setTransactionFilter} /></div><div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 -mr-2">{filteredTransactions.map(tx => { const isReconciled = reconciliationMap.has(tx.id); const relatedInvoiceId = reconciliationMap.get(tx.id); const isHovered = hoveredItemId === tx.id || hoveredItemId === relatedInvoiceId; return (<div key={tx.id} onMouseEnter={() => setHoveredItemId(tx.id)} onMouseLeave={() => setHoveredItemId(null)} className={`p-3 rounded-lg border-2 transition-all duration-200 ${isReconciled ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} ${isHovered ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg' : ''}`}><div className="flex justify-between items-start"><div><p className="font-semibold text-gray-800">{tx.description}</p><p className="text-xs text-gray-500">{tx.date}</p></div><div className="text-right text-red-600"><p className="font-bold">{formatAmount(tx.amount, 'MXN')}</p></div></div>{isReconciled ? <div className="mt-2 text-xs font-semibold text-green-700 inline-flex items-center gap-1.5"><CheckCircleIcon className="w-4 h-4"/> Reconciled</div> : <div className="mt-2 text-xs font-semibold text-amber-700 inline-flex items-center gap-1.5"><ClockIcon className="w-4 h-4"/> Pending</div>}</div>);})} {filteredTransactions.length === 0 && <div className="text-center py-10 text-gray-500">No transactions match the filter.</div>}</div></div>
                <div><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-gray-800">Received Invoices (CFDI)</h3><FilterButtons filter={invoiceFilter} setFilter={setInvoiceFilter} /></div><div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 -mr-2">{filteredInvoices.map(inv => { const isReconciled = Array.from(reconciliationMap.values()).includes(inv.uuid); let relatedTxId: string | null = null; for (const [txId, invoiceId] of reconciliationMap.entries()) { if (invoiceId === inv.uuid) { relatedTxId = txId; break; } } const isHovered = hoveredItemId === inv.uuid || hoveredItemId === relatedTxId; return (<div key={inv.uuid} onMouseEnter={() => setHoveredItemId(inv.uuid)} onMouseLeave={() => setHoveredItemId(null)} className={`p-3 rounded-lg border-2 transition-all duration-200 ${isReconciled ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} ${isHovered ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg' : ''}`}><div className="flex justify-between items-start"><div><p className="font-semibold text-gray-800">{inv.issuerName}</p><p className="text-xs text-gray-500">{inv.date}</p></div><div className="text-right"><p className="font-bold text-gray-800">{formatAmount(inv.total, inv.currency)}</p></div></div>{isReconciled ? <div className="mt-2 text-xs font-semibold text-green-700 inline-flex items-center gap-1.5"><CheckCircleIcon className="w-4 h-4"/> Reconciled</div> : <div className="mt-2 text-xs font-semibold text-amber-700 inline-flex items-center gap-1.5"><ClockIcon className="w-4 h-4"/> Pending</div>}</div>);})} {filteredInvoices.length === 0 && <div className="text-center py-10 text-gray-500">No invoices match the filter.</div>}</div></div>
            </div>
        </div>
        );
    };

    const renderSessionDetailView = () => {
        if (!viewingSession) return null;
        const session = viewingSession;
        const sessionInvoices = mockReceivedInvoices.filter(inv => {
            const invDate = new Date(inv.date);
            const sessionDate = new Date(session.data.reconciliationMonth);
            return invDate.getMonth() === sessionDate.getMonth() && invDate.getFullYear() === sessionDate.getFullYear();
        });
        const getStatusFromMap = (map: Map<string, string>, id: string, type: 'tx' | 'inv') => {
            if (type === 'tx') return map.has(id);
            if (type === 'inv') return Array.from(map.values()).includes(id);
            return false;
        };
        const reconciledItems = Array.from(session.data.reconciliationMap.entries()).map(([txId, invoiceUuid]) => {
            const tx = session.data.transactions.find(t => t.id === txId);
            const invoice = mockReceivedInvoices.find(i => i.uuid === invoiceUuid);
            return { tx, invoice };
        }).filter(item => item.tx && item.invoice);

        return (
            <div className="space-y-6 animate-fade-in">
                <button onClick={() => setViewingSession(null)} className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 mb-2"><ChevronLeftIcon className="w-4 h-4 mr-1"/> Back to History</button>
                
                <div className="relative bg-slate-800 rounded-xl p-6 overflow-hidden">
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/10 p-3 rounded-lg border border-white/20 flex-shrink-0">
                                <DocumentMagnifyingGlassIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white capitalize">Reconciliation Detail</h2>
                                <p className="text-sm text-slate-300 mt-1">{new Date(session.data.reconciliationMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <span className={`px-3 py-1 text-xs font-semibold rounded-full ${session.status === 'completed' ? 'bg-green-400/20 text-green-300' : 'bg-yellow-400/20 text-yellow-300'}`}>{session.status === 'completed' ? 'Completed' : 'Saved'}</span>
                            {session.status !== 'completed' && (
                                <button
                                    onClick={() => handleContinueSession(session)}
                                    disabled={isContinuing === session.id}
                                    className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg text-sm border border-white/20 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isContinuing === session.id ? 'Loading...' : 'Continue Reconciling'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard small title="Expense Transactions" value={session.summary.totalDebitTransactions} icon={DocumentMagnifyingGlassIcon} />
                    <StatCard small title="Reconciled" value={`${session.summary.reconciledCount} / ${session.summary.totalDebitTransactions}`} icon={CheckCircleIcon} />
                    <StatCard small title="Reconciled Amount" value={formatAmount(session.summary.reconciledAmount, 'MXN')} icon={BanknotesIcon} />
                    <StatCard small title="Pending Invoices" value={session.summary.unreconciledCount} icon={DocumentTextIcon} />
                </div>
                
                <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-2 max-w-sm">
                    <button onClick={() => setDetailViewTab('overview')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${detailViewTab === 'overview' ? 'bg-white text-slate-800' : 'text-slate-600 hover:bg-slate-200'}`}>Overview</button>
                    <button onClick={() => setDetailViewTab('report')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${detailViewTab === 'report' ? 'bg-white text-slate-800' : 'text-slate-600 hover:bg-slate-200'}`}>Detailed Report</button>
                </div>

                {detailViewTab === 'overview' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-800 mb-4">Bank Transactions (Expenses)</h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 -mr-2">{session.data.transactions.filter(tx => tx.type === 'debit').map(tx => { const isReconciled = getStatusFromMap(session.data.reconciliationMap, tx.id, 'tx'); const relatedId = session.data.reconciliationMap.get(tx.id); const isHovered = hoveredItemId === tx.id || hoveredItemId === relatedId; return (<div key={tx.id} onMouseEnter={() => setHoveredItemId(tx.id)} onMouseLeave={() => setHoveredItemId(null)} className={`p-3 rounded-lg border transition-all ${isReconciled ? 'bg-green-50/70 border-green-200' : 'bg-white border-slate-200'} ${isHovered ? 'border-blue-500 bg-blue-50' : ''}`}><div className="flex justify-between items-start"><div><p className="font-semibold text-slate-800 text-sm">{tx.description}</p><p className="text-xs text-slate-500">{tx.date}</p></div><div className="text-right text-red-600 font-bold text-sm">{formatAmount(tx.amount, 'MXN')}</div></div></div>);})}</div>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800 mb-4">Received Invoices (CFDI)</h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 -mr-2">{sessionInvoices.filter(i => i.status === 'Vigente').map(inv => { const isReconciled = getStatusFromMap(session.data.reconciliationMap, inv.uuid, 'inv'); let relatedId: string | undefined; for(const [key, val] of session.data.reconciliationMap.entries()){ if(val === inv.uuid) { relatedId = key; break; }} const isHovered = hoveredItemId === inv.uuid || hoveredItemId === relatedId; return (<div key={inv.uuid} onMouseEnter={() => setHoveredItemId(inv.uuid)} onMouseLeave={() => setHoveredItemId(null)} className={`p-3 rounded-lg border transition-all ${isReconciled ? 'bg-green-50/70 border-green-200' : 'bg-white border-slate-200'} ${isHovered ? 'border-blue-500 bg-blue-50' : ''}`}><div className="flex justify-between items-start"><div><p className="font-semibold text-slate-800 text-sm">{inv.issuerName}</p><p className="text-xs text-slate-500">{inv.date}</p></div><div className="text-right font-bold text-sm">{formatAmount(inv.total, inv.currency)}</div></div></div>);})}</div>
                        </div>
                    </div>
                ) : (
                    <div className="pt-4">
                        <h3 className="text-base font-semibold text-slate-800 mb-4">Reconciliation Report (Linked Items)</h3>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-sm">
                                <thead className="text-left text-xs text-slate-600 uppercase font-semibold">
                                    <tr className="bg-slate-100">
                                        <th colSpan={3} className="p-3 border-b border-slate-300">Bank Transaction</th>
                                        <th colSpan={4} className="p-3 border-b border-slate-300">Linked Invoice</th>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Description</th>
                                        <th className="p-3 text-right">Amount</th>
                                        <th className="p-3">UUID</th>
                                        <th className="p-3">Issuer</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {reconciledItems.map(({ tx, invoice }) => (
                                        <tr key={tx!.id} className="border-b border-slate-200 last:border-b-0">
                                            <td className="p-3 text-slate-600">{tx!.date}</td>
                                            <td className="p-3 font-medium text-slate-800">{tx!.description}</td>
                                            <td className="p-3 text-right font-semibold text-red-600">{formatAmount(tx!.amount, 'MXN')}</td>
                                            <td className="p-3 font-mono text-xs text-slate-600" title={invoice!.uuid}>{invoice!.uuid.substring(0, 13)}...</td>
                                            <td className="p-3 font-medium text-slate-800">{invoice!.issuerName}</td>
                                            <td className="p-3 text-slate-600">{invoice!.date}</td>
                                            <td className="p-3 text-right font-semibold text-slate-800">{formatAmount(invoice!.total, invoice!.currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {reconciledItems.length === 0 && <div className="text-center py-10 text-slate-500 bg-white">No reconciled items to display.</div>}
                        </div>
                    </div>
                )}
            </div>
        )
    };
    
    const renderReconciliationModule = () => {
        if (transactions.length > 0) {
            return renderActiveReconciliationView();
        }
        return renderNewReconciliationSetupView();
    };

    if (viewingSession) {
        return renderSessionDetailView();
    }
    
    return (
        <div className="animate-fade-in space-y-6">
            <Banner
                title="SAT Invoice Manager"
                description={`Connected with RFC: ${rfc}. Synchronize, manage, and reconcile your CFDI invoices with your bank transactions.`}
                icon={DocumentMagnifyingGlassIcon}
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <header className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setMainView('cfdi')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mainView === 'cfdi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>CFDI Query</button>
                        <button onClick={() => { resetNewReconciliation(); setMainView('reconciliation'); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mainView === 'reconciliation' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>New Reconciliation</button>
                        <button onClick={() => setMainView('history')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mainView === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>History</button>
                    </div>
                </header>
                
                {mainView === 'cfdi' ? renderCfdiView() : mainView === 'reconciliation' ? renderReconciliationModule() : renderHistoryView()}
            </div>
        </div>
    );
};

export default BankReconciliationPage;