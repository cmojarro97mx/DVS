import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, View, Note, TeamMember, Expense, Invoice, Payment, UploadedFile, Task, Column, BankAccount, Client, Currency, Commission, CommissionSnapshot, EmailMessage, FileSystemItem } from './DashboardPage';
import { operationsService } from '../src/services/operationsService';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { TruckIcon } from '../components/icons/TruckIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { PaperClipIcon } from '../components/icons/PaperClipIcon';
import { FileIcon } from '../components/icons/FileIcon';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { XIcon } from '../components/icons/XIcon';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { NotesIcon } from '../components/icons/NotesIcon';
import { TasksIcon } from '../components/icons/TasksIcon';
import TaskManager from './TaskManager';
import { ProjectAvatar } from '../components/ProjectAvatar';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { ExpensesIcon } from '../components/icons/ExpensesIcon';
import ExpensesManager from './ExpensesManager';
import { ShipIcon } from '../components/icons/ShipIcon';
import { MoreVerticalIcon } from '../components/icons/MoreVerticalIcon';
import { InvoicesIcon } from '../components/icons/InvoicesIcon';
import { PaymentsIcon } from '../components/icons/PaymentsIcon';
import InvoicesManager from './InvoicesManager';
import { ChartPieIcon } from '../components/icons/ChartPieIcon';
import { ArrowUpCircleIcon } from '../components/icons/ArrowUpCircleIcon';
import { ArrowDownCircleIcon } from '../components/icons/ArrowDownCircleIcon';
import { ExclamationTriangleIcon } from '../components/icons/ExclamationTriangleIcon';
import { PercentageIcon } from '../components/icons/PercentageIcon';
import { ClockRewindIcon } from '../components/icons/ClockRewindIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { MailIcon } from '../components/icons/MailIcon';
import { EmailAvatar } from '../components/EmailAvatar';
import { SearchIcon } from '../components/icons/SearchIcon';
import PaymentsManager from './PaymentsManager';
import { EmailViewer } from '../components/EmailViewer';
import { MapPinIcon } from '../components/icons/MapPinIcon';
import { CpuChipIcon } from '../components/icons/CpuChipIcon';
import { BriefcaseIcon } from '../components/icons/BriefcaseIcon';
import { FolderIcon } from '../components/icons/FolderIcon';
import { FolderPlusIcon } from '../components/icons/FolderPlusIcon';
import NewFolderModal from '../components/NewFolderModal';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { EditIcon } from '../components/icons/EditIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { DocumentPdfIcon } from '../components/icons/DocumentPdfIcon';
import { PhotoIcon } from '../components/icons/PhotoIcon';
import { DocumentCsvIcon } from '../components/icons/DocumentCsvIcon';
import { WarehouseIcon } from '../components/icons/WarehouseIcon';
import { LinkIcon } from '../components/icons/LinkIcon';

type ActiveTab = 'overview' | 'tasks' | 'documents' | 'notes' | 'members' | 'expenses' | 'invoices' | 'payments' | 'commissions' | 'emails';

interface OperationDetailPageProps {
  setActiveView: (view: View) => void;
  project: Project;
  client?: Client;
  documents: FileSystemItem[];
  onUpdateDocuments: (updatedFiles: FileSystemItem[]) => void;
  notes: Note[];
  onAddNote: (content: string, file?: File) => void;
  onUpdateNote: (noteId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  invoices: Invoice[];
  onAddInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onUpdatePayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateColumns: (newColumns: Record<string, Column>) => void;
  onUpdateAssignees: (newAssignees: string[]) => void;
  onUpdateCommissionHistory: (history: CommissionSnapshot[]) => void;
  teamMembers: TeamMember[];
  bankAccounts: BankAccount[];
  initialState: { openTab?: string; editInvoiceId?: string; viewInvoiceId?: string } | null;
  onClearInitialState: () => void;
  emails: EmailMessage[];
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Delivered': return 'bg-green-100 text-green-800';
        case 'In Transit': return 'bg-blue-100 text-blue-800';
        case 'On Hold': return 'bg-yellow-100 text-yellow-800';
        case 'Canceled': return 'bg-red-100 text-red-800';
        case 'Planning': return 'bg-gray-100 text-gray-800';
        case 'Customs Clearance': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
    {status}
  </span>
);

const DetailCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; padding?: string }> = ({ title, icon: Icon, children, padding = 'p-4' }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="p-4 border-b border-gray-200 flex items-center">
      <Icon className="w-5 h-5 text-gray-500 mr-3" />
      <h3 className="text-md font-bold text-gray-800">{title}</h3>
    </div>
    <div className={padding}>
      {children}
    </div>
  </div>
);


const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; children?: React.ReactNode; className?: string }> = ({ label, value, children, className = '' }) => (
  <div className={className}>
    <p className="text-xs text-gray-500 font-medium">{label}</p>
    <div className="text-sm text-gray-800 font-semibold">{children || value || 'N/A'}</div>
  </div>
);


const TabButton: React.FC<{ label: string, icon: React.ElementType, isActive: boolean, onClick: () => void }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-200 ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
);

const FileTypeIcon: React.FC<{ fileType: string, className?: string }> = ({ fileType, className = "w-8 h-8 text-gray-500" }) => {
    if (fileType.startsWith('image/')) return <PhotoIcon className={className} />;
    if (fileType === 'application/pdf') return <DocumentPdfIcon className={className} />;
    if (fileType.includes('spreadsheet') || fileType.includes('csv')) return <DocumentCsvIcon className={className} />;
    if (fileType.startsWith('application/vnd.openxmlformats-officedocument') || fileType === 'application/msword') return <DocumentTextIcon className={className} />;
    return <FileIcon className={className} />;
};

const ProjectDocuments: React.FC<{
    documents: FileSystemItem[];
    onUpdateDocuments: (files: FileSystemItem[]) => void;
}> = ({ documents, onUpdateDocuments }) => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<FileSystemItem | null>(null);
    const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentPath = useMemo(() => {
        const path = [{ id: null, name: 'Documents' }];
        if (!currentFolderId) return path;

        let parentId: string | null = currentFolderId;
        const breadcrumbs = [];
        while (parentId) {
            const folder = documents.find(item => item.id === parentId);
            if (folder) {
                breadcrumbs.unshift({ id: folder.id, name: folder.name });
                parentId = folder.parentId;
            } else {
                break;
            }
        }
        return [...path, ...breadcrumbs];
    }, [currentFolderId, documents]);

    const currentItems = useMemo(() => {
        return documents
            .filter(item => item.parentId === currentFolderId)
            .sort((a, b) => {
                if (a.type === 'folder' && b.type === 'file') return -1;
                if (a.type === 'file' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
            });
    }, [documents, currentFolderId]);

    const handleCreateFolder = (name: string) => {
        const newFolder: FileSystemItem = { id: `folder-${Date.now()}`, name, type: 'folder', parentId: currentFolderId };
        onUpdateDocuments([...documents, newFolder]);
    };

    const handleUploadFiles = (files: FileList) => {
        if (!files) return;
        const newFiles: FileSystemItem[] = Array.from(files).map(file => ({
            id: `file-${Date.now()}-${Math.random()}`, name: file.name, type: 'file', parentId: currentFolderId,
            file: file, preview: URL.createObjectURL(file),
        }));
        onUpdateDocuments([...documents, ...newFiles]);
    };

    const handleDeleteItem = () => {
        if (!itemToDelete) return;
        let idsToDelete = [itemToDelete.id];
        if (itemToDelete.type === 'folder') {
            const findChildren = (parentId: string) => {
                documents.filter(item => item.parentId === parentId).forEach(child => {
                    idsToDelete.push(child.id);
                    if (child.type === 'folder') findChildren(child.id);
                });
            };
            findChildren(itemToDelete.id);
        }
        onUpdateDocuments(documents.filter(item => !idsToDelete.includes(item.id)));
        setItemToDelete(null);
    };

    const handleRenameItem = (id: string, newName: string) => {
        onUpdateDocuments(documents.map(item => item.id === id ? { ...item, name: newName } : item));
        setRenamingItemId(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) handleUploadFiles(e.dataTransfer.files);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <nav className="flex items-center text-sm font-medium text-gray-500">
                    {currentPath.map((part, index) => (
                        <React.Fragment key={part.id || 'root'}>
                            <button onClick={() => setCurrentFolderId(part.id)} className="hover:text-blue-600 disabled:hover:text-gray-500 disabled:cursor-default" disabled={index === currentPath.length - 1}>{part.name}</button>
                            {index < currentPath.length - 1 && <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
                        </React.Fragment>
                    ))}
                </nav>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsNewFolderModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"><FolderPlusIcon className="w-4 h-4" /> New Folder</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"><UploadCloudIcon className="w-4 h-4" /> Upload</button>
                    <input type="file" multiple ref={fileInputRef} onChange={e => e.target.files && handleUploadFiles(e.target.files)} className="hidden" />
                </div>
            </div>
            <div className={`min-h-[300px] rounded-lg p-2 transition-colors ${isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                {currentItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {currentItems.map(item => (
                            <div key={item.id} onDoubleClick={() => item.type === 'folder' && setCurrentFolderId(item.id)} className="relative group rounded-lg border border-gray-200 p-3 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center">
                                <div className="h-16 flex items-center justify-center">
                                    {item.type === 'folder' ? <FolderIcon className="w-12 h-12 text-yellow-500"/> : <FileTypeIcon fileType={item.file!.type} className="w-12 h-12" />}
                                </div>
                                <p className="font-semibold text-xs text-gray-800 truncate w-full mt-2" title={item.name}>{item.name}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-500 p-10 border-2 border-dashed border-gray-300 rounded-xl">
                        <UploadCloudIcon className="w-12 h-12 text-gray-300" />
                        <h3 className="mt-4 text-md font-semibold text-gray-800">This folder is empty</h3>
                        <p className="mt-1 text-xs">Drag and drop files here to upload</p>
                    </div>
                )}
            </div>
            <NewFolderModal isOpen={isNewFolderModalOpen} onClose={() => setIsNewFolderModalOpen(false)} onCreate={handleCreateFolder} />
        </div>
    );
};

const ProjectNotes: React.FC<{
    notes: Note[];
    onAddNote: (content: string, file?: File) => void;
    onUpdateNote: (noteId: string, content: string) => void;
    onDeleteNote: (noteId: string) => void;
}> = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
    const [newNoteContent, setNewNoteContent] = useState('');
    const [editingNote, setEditingNote] = useState<{ id: string; content: string } | null>(null);
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddClick = () => {
        if (newNoteContent.trim() || attachment) {
            onAddNote(newNoteContent, attachment || undefined);
            setNewNoteContent('');
            setAttachment(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSaveEdit = () => {
      if (editingNote && editingNote.content.trim()) {
        onUpdateNote(editingNote.id, editingNote.content);
        setEditingNote(null);
      }
    };

    const handleDeleteClick = (noteId: string) => {
      if(window.confirm('Are you sure you want to delete this note?')) {
        onDeleteNote(noteId);
      }
      setActiveMenu(null);
    };

    const startEditing = (note: Note) => {
        setEditingNote({ id: note.id, content: note.content });
        setActiveMenu(null);
    }

    const sortedNotes = [...notes].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                     <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <PencilIcon className="w-5 h-5 mr-3 text-blue-600" />
                        Add New Note
                    </h3>
                    <div className="space-y-3">
                        <textarea
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder="Write an update, attach a document, or share relevant information..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white text-gray-900 placeholder-gray-500 transition-shadow focus:shadow-sm"
                            rows={6}
                        />
                        {attachment && (
                            <div className="px-3 py-2 flex items-center justify-between bg-blue-50 rounded-lg text-sm border border-blue-200">
                                <div className="flex items-center min-w-0">
                                    <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                                    <span className="text-gray-800 font-medium truncate">{attachment.name}</span>
                                </div>
                                <button onClick={() => { setAttachment(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="text-gray-500 hover:text-red-600 ml-2 p-1 rounded-full hover:bg-red-100">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200/60 transition-colors" aria-label="Attach file">
                                <PaperClipIcon className="w-5 h-5" />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button 
                                onClick={handleAddClick} 
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
                                disabled={!newNoteContent.trim() && !attachment}
                            >
                                Add Note
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Operation History</h3>
                    <ul className="space-y-6">
                        {sortedNotes.length > 0 ? sortedNotes.map((note) => (
                            <li key={note.id} className="flex gap-x-3">
                                <div className="relative flex-none w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full ring-8 ring-white">
                                    <UserCircleIcon className="w-6 h-6 text-gray-400" />
                                </div>
                                <div className="flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200 bg-gray-50/50">
                                    <div className="flex justify-between gap-x-4">
                                        <div className="py-0.5 text-xs leading-5 text-gray-500">
                                            <span className="font-medium text-gray-900">{note.author}</span> commented
                                        </div>
                                        <div className="flex items-center gap-x-4">
                                            <time dateTime={note.timestamp} className="flex-none py-0.5 text-xs leading-5 text-gray-500">
                                                {note.timestamp}
                                            </time>
                                            <div className="relative">
                                                <button onClick={() => setActiveMenu(activeMenu === note.id ? null : note.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded-full transition-colors">
                                                    <MoreVerticalIcon className="w-4 h-4" />
                                                </button>
                                                {activeMenu === note.id && (
                                                    <div ref={menuRef} className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                                                        <button onClick={() => startEditing(note)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                            <PencilIcon className="w-4 h-4 mr-2" /> Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(note.id)} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                                            <TrashIcon className="w-4 h-4 mr-2" /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {editingNote?.id === note.id ? (
                                        <div className="mt-2">
                                            <textarea value={editingNote.content} onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })} className="w-full p-2 border bg-white text-gray-900 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" rows={3}/>
                                            <div className="flex justify-end space-x-2 mt-2">
                                                <button onClick={() => setEditingNote(null)} className="px-3 py-1 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100">Cancel</button>
                                                <button onClick={handleSaveEdit} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-sm text-gray-700 space-y-3">
                                            {note.content && <p className="whitespace-pre-wrap">{note.content}</p>}
                                            {note.attachment && (
                                                note.attachment.file.type.startsWith('image/') ? (
                                                    <a href={note.attachment.preview} target="_blank" rel="noopener noreferrer" className="block w-full max-w-xs rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                                                        <img src={note.attachment.preview} alt={note.attachment.file.name} className="w-full h-auto object-cover" />
                                                    </a>
                                                ) : (
                                                    <a href={note.attachment.preview} target="_blank" rel="noopener noreferrer" className="inline-flex items-center py-2 px-3 bg-white border border-gray-200 rounded-md hover:bg-gray-100 transition-colors">
                                                        <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-500" />
                                                        <span className="text-sm text-blue-600 font-medium">{note.attachment.file.name}</span>
                                                    </a>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </li>
                        )) : (
                            <div className="text-center text-gray-500 text-sm py-16 flex flex-col items-center border-2 border-dashed border-gray-200 rounded-lg">
                                <NotesIcon className="w-12 h-12 text-gray-300 mb-4" />
                                <h4 className="font-semibold text-gray-700">No notes for this operation.</h4>
                                <p>Use the form on the left to add the first note.</p>
                            </div>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const ProjectMembers: React.FC<{
  projectAssignees: string[];
  allTeamMembers: TeamMember[];
  onUpdateAssignees: (newAssignees: string[]) => void;
}> = ({ projectAssignees, allTeamMembers, onUpdateAssignees }) => {
  const [memberToAdd, setMemberToAdd] = useState('');

  const availableMembers = allTeamMembers.filter(
    member => !projectAssignees.includes(member.name)
  );

  const handleAddMember = () => {
    if (memberToAdd && !projectAssignees.includes(memberToAdd)) {
      const newAssignees = [...projectAssignees, memberToAdd];
      onUpdateAssignees(newAssignees);
      setMemberToAdd('');
    }
  };

  const handleRemoveMember = (memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this operation?`)) {
      const newAssignees = projectAssignees.filter(name => name !== memberName);
      onUpdateAssignees(newAssignees);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Assigned Members</h3>
        <div className="flex items-center gap-2">
          <select
            value={memberToAdd}
            onChange={(e) => setMemberToAdd(e.target.value)}
            className="block w-48 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="" disabled>Select member...</option>
            {availableMembers.map(member => (
              <option key={member.id} value={member.name}>{member.name}</option>
            ))}
          </select>
          <button
            onClick={handleAddMember}
            disabled={!memberToAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {projectAssignees.map(assigneeName => (
          <div key={assigneeName} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <UserCircleIcon className="w-8 h-8 text-gray-400 mr-3" />
              <span className="text-sm font-medium text-gray-800">{assigneeName}</span>
            </div>
            <button
              onClick={() => handleRemoveMember(assigneeName)}
              className="text-gray-400 hover:text-red-600"
              title={`Remove ${assigneeName}`}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
        {projectAssignees.length === 0 && (
          <p className="col-span-full text-center text-gray-500 text-sm py-8">No members assigned to this operation.</p>
        )}
      </div>
    </div>
  );
};

const FinancialSummary: React.FC<{
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  currency: Currency;
}> = ({ invoices, payments, expenses, currency }) => {
    const formatCurrency = (amount: number) => 
        `${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;

    const { totalInvoiced, totalPaid, totalExpenses, balanceDue, profitability } = useMemo(() => {
        const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.price, 0);

        const balanceDue = totalInvoiced - totalPaid;
        const profitability = totalInvoiced - totalExpenses;

        return { totalInvoiced, totalPaid, totalExpenses, balanceDue, profitability };
    }, [invoices, payments, expenses]);

    if (invoices.length === 0 && expenses.length === 0) {
        return (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                <ChartPieIcon className="mx-auto w-10 h-10 text-gray-300 mb-2"/>
                <p className="font-semibold">No financial data available.</p>
                <p className="text-sm">Add invoices or expenses to see a summary.</p>
            </div>
        );
    }

    const profitabilityColor = profitability >= 0 ? 'text-green-600' : 'text-red-600';
    const balanceColor = balanceDue > 0 ? 'text-yellow-700' : 'text-green-700';
    const BalanceIcon = balanceDue > 0 ? ExclamationTriangleIcon : CheckCircleIcon;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ChartPieIcon className="w-6 h-6 text-blue-600"/>
                Financial Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Projected Profit */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm font-semibold text-slate-600">Projected Profit</p>
                    <p className={`text-3xl font-bold mt-2 ${profitabilityColor}`}>
                        {formatCurrency(profitability)}
                    </p>
                </div>

                {/* Balance Due */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm font-semibold text-slate-600">Balance Due</p>
                     <div className={`flex items-center gap-2 mt-2 ${balanceColor}`}>
                        <BalanceIcon className="w-8 h-8"/>
                        <p className="text-3xl font-bold">
                            {formatCurrency(balanceDue > 0 ? balanceDue : 0)}
                        </p>
                    </div>
                </div>

                {/* Total Invoiced */}
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-4">
                    <ArrowUpCircleIcon className="w-8 h-8 text-slate-400 flex-shrink-0"/>
                    <div>
                        <p className="text-sm font-semibold text-slate-600">Total Invoiced</p>
                        <p className="text-xl font-bold text-slate-800">
                            {formatCurrency(totalInvoiced)}
                        </p>
                    </div>
                </div>

                {/* Total Expenses */}
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-4">
                    <ArrowDownCircleIcon className="w-8 h-8 text-slate-400 flex-shrink-0"/>
                    <div>
                        <p className="text-sm font-semibold text-slate-600">Total Expenses</p>
                        <p className="text-xl font-bold text-slate-800">
                            {formatCurrency(totalExpenses)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommissionsManager: React.FC<{
  project: Project;
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  onUpdateCommissionHistory: (history: CommissionSnapshot[]) => void;
}> = ({ project, invoices, payments, expenses, onUpdateCommissionHistory }) => {
    const [localCommissions, setLocalCommissions] = useState<Record<string, number>>({});
    const [viewingSnapshot, setViewingSnapshot] = useState<CommissionSnapshot | null>(null);

    const latestSnapshot = useMemo(() => {
        if (!project.commissionHistory || project.commissionHistory.length === 0) {
            return null;
        }
        return [...project.commissionHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    }, [project.commissionHistory]);

    useEffect(() => {
        const initialRates: Record<string, number> = {};
        const sourceCommissions = latestSnapshot?.commissions || [];

        project.assignees.forEach(assignee => {
            const existing = sourceCommissions.find(c => c.employeeName === assignee);
            initialRates[assignee] = existing?.rate || 0;
        });
        setLocalCommissions(initialRates);
    }, [project.assignees, latestSnapshot]);

    const handleRateChange = (employeeName: string, rate: string) => {
        const numericRate = parseFloat(rate);
        if (!isNaN(numericRate) && numericRate >= 0) {
            setLocalCommissions(prev => ({ ...prev, [employeeName]: numericRate }));
        } else if (rate === '') {
             setLocalCommissions(prev => ({ ...prev, [employeeName]: 0 }));
        }
    };

    const { totalInvoiced, totalExpenses, projectedProfit, totalPayments, realProfit } = useMemo(() => {
        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.price, 0);
        const projectedProfit = totalInvoiced - totalExpenses;
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        const realProfit = totalPayments - totalExpenses;
        return { totalInvoiced, totalExpenses, projectedProfit, totalPayments, realProfit };
    }, [invoices, payments, expenses]);

    const handleSave = () => {
        const newSnapshot: CommissionSnapshot = {
            id: `cs-${Date.now()}`,
            timestamp: new Date().toISOString(),
            savedBy: 'Current User', // In a real app, this would be the logged-in user
            commissions: Object.entries(localCommissions).map(([employeeName, rate]) => ({ employeeName, rate: Number(rate) })),
            projectedProfit,
            realProfit,
        };

        const newHistory = [...(project.commissionHistory || []), newSnapshot];
        onUpdateCommissionHistory(newHistory);
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(amount);

    const HistoryDetailModal: React.FC<{ snapshot: CommissionSnapshot | null, onClose: () => void }> = ({ snapshot, onClose }) => {
        if (!snapshot) return null;
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                    <div className="p-5 border-b flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Commission Snapshot</h3>
                            <p className="text-sm text-gray-500">Saved by {snapshot.savedBy} on {new Date(snapshot.timestamp).toLocaleString()}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5 text-gray-600"/></button>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Projected Profit at that time</p><p className="font-bold text-lg text-gray-800">{formatCurrency(snapshot.projectedProfit)}</p></div>
                            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Real Profit at that time</p><p className="font-bold text-lg text-green-700">{formatCurrency(snapshot.realProfit)}</p></div>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="text-left bg-gray-100"><tr className="text-xs text-gray-600 uppercase"><th className="p-2">Employee</th><th className="p-2">Rate</th><th className="p-2 text-right">Projected Commission</th><th className="p-2 text-right">Real Commission</th></tr></thead>
                            <tbody>
                                {snapshot.commissions.map(c => (
                                    <tr key={c.employeeName} className="border-b"><td className="p-2 font-medium text-gray-800">{c.employeeName}</td><td className="p-2">{c.rate}%</td><td className="p-2 text-right">{formatCurrency((snapshot.projectedProfit > 0 ? snapshot.projectedProfit : 0) * (c.rate / 100))}</td><td className="p-2 text-right font-semibold text-green-700">{formatCurrency((snapshot.realProfit > 0 ? snapshot.realProfit : 0) * (c.rate / 100))}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <h4 className="font-bold text-gray-800">Projected Profit</h4>
                        <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Total Invoiced</span><span className="font-medium text-gray-700">{formatCurrency(totalInvoiced)}</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Total Expenses</span><span className="font-medium text-gray-700">- {formatCurrency(totalExpenses)}</span></div>
                        <div className="border-t my-2"></div>
                        <div className={`flex justify-between items-center font-bold text-2xl ${projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}><span>Profit</span><span>{formatCurrency(projectedProfit)}</span></div>
                    </div>
                     <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <h4 className="font-bold text-gray-800">Real Profit</h4>
                        <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Payments Received</span><span className="font-medium text-gray-700">{formatCurrency(totalPayments)}</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Total Expenses</span><span className="font-medium text-gray-700">- {formatCurrency(totalExpenses)}</span></div>
                        <div className="border-t my-2"></div>
                        <div className={`flex justify-between items-center font-bold text-2xl ${realProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}><span>Profit</span><span>{formatCurrency(realProfit)}</span></div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Set Commission Rates</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left bg-gray-50"><tr className="text-xs text-gray-600 uppercase"><th className="p-3">Employee</th><th className="p-3 w-40">Rate (%)</th><th className="p-3 text-right">Projected Value</th><th className="p-3 text-right">Real Value</th></tr></thead>
                            <tbody>
                                {project.assignees.map(assignee => {
                                    const rate = localCommissions[assignee] || 0;
                                    const projectedCommission = (projectedProfit > 0) ? projectedProfit * (rate / 100) : 0;
                                    const realCommission = (realProfit > 0) ? realProfit * (rate / 100) : 0;
                                    return (
                                        <tr key={assignee} className="border-b"><td className="p-3 font-medium text-gray-900">{assignee}</td><td className="p-3"><input type="number" value={localCommissions[assignee] ?? ''} onChange={(e) => handleRateChange(assignee, e.target.value)} className="w-full bg-gray-100 border-gray-300 rounded-md py-1.5 px-2 text-right focus:ring-blue-500 focus:border-blue-500 [color-scheme:light]" min="0" step="0.1" /></td><td className="p-3 text-right font-semibold text-gray-700">{formatCurrency(projectedCommission)}</td><td className="p-3 text-right font-bold text-green-700">{formatCurrency(realCommission)}</td></tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {project.assignees.length === 0 && <p className="text-center py-8 text-gray-500">No employees assigned to this operation.</p>}
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                        <p className="text-xs text-gray-500">Last saved: {latestSnapshot ? new Date(latestSnapshot.timestamp).toLocaleString() : 'Never'}</p>
                        <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5" />Save Commission Rates</button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ClockRewindIcon className="w-6 h-6 text-gray-500"/>Commission History</h3>
                {(project.commissionHistory && project.commissionHistory.length > 0) ? (
                    <div className="space-y-4">
                        {[...project.commissionHistory].reverse().map(snapshot => (
                            <div key={snapshot.id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg grid grid-cols-4 items-center gap-4">
                                <div><p className="font-semibold text-sm text-gray-800">{new Date(snapshot.timestamp).toLocaleString()}</p><p className="text-xs text-gray-500">by {snapshot.savedBy}</p></div>
                                <div><p className="text-xs text-gray-500">Projected Profit</p><p className={`font-semibold ${snapshot.projectedProfit >= 0 ? 'text-gray-700' : 'text-red-600'}`}>{formatCurrency(snapshot.projectedProfit)}</p></div>
                                <div><p className="text-xs text-gray-500">Real Profit</p><p className={`font-semibold ${snapshot.realProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(snapshot.realProfit)}</p></div>
                                <div className="text-right"><button onClick={() => setViewingSnapshot(snapshot)} className="text-sm font-medium text-blue-600 hover:underline">View Details</button></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-gray-500 py-8">No commission history recorded. Save the current rates to create the first record.</p>
                )}
            </div>
            <HistoryDetailModal snapshot={viewingSnapshot} onClose={() => setViewingSnapshot(null)} />
        </div>
    );
};

const AirplaneLogisticsIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

const ShipmentJourney: React.FC<{ project: Project }> = ({ project }) => {
    const JourneyIcon = useMemo(() => {
        const mode = (project.shippingMode || '').toLowerCase();
        if (mode.includes('sea')) return ShipIcon;
        if (mode.includes('air')) return AirplaneLogisticsIcon;
        return TruckIcon;
    }, [project.shippingMode]);

    return (
        <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
                {/* Origin */}
                <div className="w-1/3 text-center flex flex-col items-center">
                    <div className="p-3 bg-white rounded-full border-2 border-slate-200 mb-2">
                        <WarehouseIcon className="w-6 h-6 text-slate-500"/>
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Origin</p>
                    <p className="font-semibold text-gray-800 mt-1 truncate w-full" title={project.pickupAddress}>{project.pickupAddress || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-1">ETD: {project.etd || 'N/A'}</p>
                </div>

                {/* Journey Line */}
                <div className="flex-grow flex items-center justify-center px-4">
                    <div className="w-full h-1 bg-slate-200 rounded-full relative">
                        <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%`, transition: 'width 1s ease-in-out' }}></div>
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 p-1.5 bg-white rounded-full shadow-lg border-2 border-blue-500"
                            style={{ left: `${project.progress}%`, transition: 'left 1s ease-in-out' }}
                        >
                             <JourneyIcon className="w-5 h-5 text-blue-600 animate-pulse-strong" />
                        </div>
                    </div>
                </div>

                {/* Destination */}
                 <div className="w-1/3 text-center flex flex-col items-center">
                    <div className="p-3 bg-white rounded-full border-2 border-slate-200 mb-2">
                        <MapPinIcon className="w-6 h-6 text-slate-500"/>
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Destination</p>
                    <p className="font-semibold text-gray-800 mt-1 truncate w-full" title={project.deliveryAddress}>{project.deliveryAddress || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-1">ETA: {project.eta || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};


const OperationDetailPage: React.FC<OperationDetailPageProps> = ({ 
  setActiveView, project, documents, onUpdateDocuments, 
  notes, onAddNote, onUpdateNote, onDeleteNote, 
  expenses, onAddExpense, onUpdateExpense, onDeleteExpense,
  invoices, onAddInvoice, onUpdateInvoice, onDeleteInvoice,
  payments, onAddPayment, onUpdatePayment, onDeletePayment,
  tasks, columns, columnOrder, onSaveTask, onDeleteTask, onUpdateColumns,
  teamMembers, onUpdateAssignees, onUpdateCommissionHistory, bankAccounts, client,
  initialState, onClearInitialState, emails
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [initialEditInvoiceId, setInitialEditInvoiceId] = useState<string | undefined>(undefined);
  const [initialViewInvoiceId, setInitialViewInvoiceId] = useState<string | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relatedEmails, setRelatedEmails] = useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [linkingCriteria, setLinkingCriteria] = useState<any>(null);
  const [selectedEmailForView, setSelectedEmailForView] = useState<any>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    if (initialState) {
        if (initialState.openTab) {
            setActiveTab(initialState.openTab as ActiveTab);
        }
        if (initialState.editInvoiceId) {
            setInitialEditInvoiceId(initialState.editInvoiceId);
        }
        if (initialState.viewInvoiceId) {
            setInitialViewInvoiceId(initialState.viewInvoiceId);
        }
    }
  }, [initialState]);

  useEffect(() => {
    const loadRelatedEmails = async () => {
      if (activeTab === 'emails') {
        setLoadingEmails(true);
        try {
          const [emails, criteria] = await Promise.all([
            operationsService.getRelatedEmails(project.id),
            operationsService.getEmailLinkingCriteria(project.id)
          ]);
          setRelatedEmails(emails);
          setLinkingCriteria(criteria);
        } catch (error) {
          console.error('Error loading related emails:', error);
        } finally {
          setLoadingEmails(false);
        }
      }
    };
    loadRelatedEmails();
  }, [activeTab, project.id]);


  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setIsMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, []);

  const handleDeleteOperation = async () => {
    try {
      setIsDeleting(true);
      await operationsService.delete(project.id);
      setActiveView('operations');
    } catch (error) {
      console.error('Error deleting operation:', error);
      alert('Error al eliminar la operación');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    try {
      await operationsService.deleteDocument(project.id, documentId);
      onUpdateDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const handleViewEmail = (email: any) => {
    setSelectedEmailForView(email);
    setIsEmailModalOpen(true);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <FinancialSummary invoices={invoices} payments={payments} expenses={expenses} currency={project.currency} />
      <DetailCard title="Project Details" icon={ClipboardListIcon}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
            <DetailItem label="Category" value={project.projectCategory} />
            <DetailItem label="Operation Type" value={project.operationType} />
            <DetailItem label="Assigned To">
                <div className="flex items-center -space-x-2 pt-1">
                    {project.assignees.slice(0, 5).map(assignee => (
                        <div key={assignee} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white ring-1 ring-gray-300" title={assignee}>
                            {assignee.split(' ').map(n=>n[0]).join('').toUpperCase()}
                        </div>
                    ))}
                    {project.assignees.length > 5 && (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 border-2 border-white ring-1 ring-gray-300">
                            +{project.assignees.length - 5}
                        </div>
                    )}
                    {project.assignees.length === 0 && (
                        <div className="text-sm text-gray-500 italic">Unassigned</div>
                    )}
                </div>
            </DetailItem>
            <DetailItem label="Start Date" value={project.startDate} />
            <DetailItem label="Deadline" value={project.deadline} />
        </div>
      </DetailCard>

      <DetailCard title="Shipment Information" icon={TruckIcon}>
        <div className="space-y-6">
            <ShipmentJourney project={project} />
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 pt-6 border-t border-gray-200">
                <DetailItem label="Shipping Mode" value={project.shippingMode} />
                <DetailItem label="Courrier" value={project.courrier} />
                <DetailItem label="Insurance" value={project.insurance} />
                <DetailItem label="Pickup Address" value={project.pickupAddress} className="sm:col-span-3" />
                <DetailItem label="Delivery Address" value={project.deliveryAddress} className="sm:col-span-3" />
            </div>
        </div>
      </DetailCard>

      <DetailCard title="Tracking & Dates" icon={CalendarIcon}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
            <DetailItem label="Pickup Date" value={project.pickupDate} />
            <DetailItem label="ETD" value={project.etd} />
            <DetailItem label="ETA" value={project.eta} />
            <DetailItem label="Booking / Tracking" value={project.bookingTracking} className="sm:col-span-2" />
            <DetailItem label="MBL / AWB" value={project.mbl_awb} />
            <DetailItem label="HBL / AWB" value={project.hbl_awb} />
        </div>
      </DetailCard>
    </div>
  );

  if (!project) return <div>Loading...</div>;

  const handleInitialIntentConsumed = () => {
    setInitialEditInvoiceId(undefined);
    setInitialViewInvoiceId(undefined);
    onClearInitialState();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                <ProjectAvatar projectName={project.projectName} />
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{project.projectName}</h2>
                    <p className="text-sm font-mono text-gray-500">{project.id}</p>
                </div>
                </div>
                <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <MoreVerticalIcon className="w-5 h-5 text-gray-500" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        alert('Funcionalidad de edición en desarrollo');
                      }}
                      className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        <PencilIcon className="w-4 h-4 text-gray-500"/> Editar Operación
                    </button>
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                        <TrashIcon className="w-4 h-4"/> Eliminar Operación
                    </button>
                    </div>
                )}
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Client</p>
                    <div className="flex items-center gap-2">
                        <UserCircleIcon className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-800">{client?.name || 'N/A'}</span>
                    </div>
                </div>
                 <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
                    <StatusBadge status={project.status} />
                </div>
                 <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Team</p>
                    <div className="flex items-center -space-x-2">
                        {project.assignees.slice(0, 3).map(assignee => (
                        <div key={assignee} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white ring-1 ring-gray-300" title={assignee}>
                            {assignee.split(' ').map(n=>n[0]).join('')}
                        </div>
                        ))}
                        {project.assignees.length > 3 && (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 border-2 border-white ring-1 ring-gray-300">
                            +{project.assignees.length - 3}
                        </div>
                        )}
                        {project.assignees.length === 0 && (
                        <div className="text-xs text-gray-400 italic">Unassigned</div>
                        )}
                    </div>
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Progress</p>
                    <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-10 text-right">{project.progress}%</span>
                    </div>
                </div>
            </div>
        </div>
        <div className="border-t border-b border-gray-200">
            <nav className="flex items-center overflow-x-auto no-scrollbar pt-1">
              <TabButton label="Overview" icon={ClipboardListIcon} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <TabButton label="Tasks" icon={TasksIcon} isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
              <TabButton label="Emails" icon={MailIcon} isActive={activeTab === 'emails'} onClick={() => setActiveTab('emails')} />
              <TabButton label="Documents" icon={PaperClipIcon} isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
              <TabButton label="Notes" icon={NotesIcon} isActive={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
              <TabButton label="Members" icon={UsersIcon} isActive={activeTab === 'members'} onClick={() => setActiveTab('members')} />
              <TabButton label="Expenses" icon={ExpensesIcon} isActive={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
              <TabButton label="Invoices" icon={InvoicesIcon} isActive={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')} />
              <TabButton label="Payments" icon={PaymentsIcon} isActive={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
              <TabButton label="Commissions" icon={PercentageIcon} isActive={activeTab === 'commissions'} onClick={() => setActiveTab('commissions')} />
            </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'tasks' && <TaskManager 
                                      operationId={project.id}
                                      teamMembers={teamMembers} 
                                      operationAssignees={project.assignees} 
                                      tasks={tasks}
                                      columns={columns}
                                      columnOrder={columnOrder}
                                      onSaveTask={onSaveTask}
                                      onDeleteTask={onDeleteTask}
                                      onUpdateColumns={onUpdateColumns}
                                  />}
        {activeTab === 'emails' && (
            <div className="space-y-4">
              {loadingEmails ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <p className="mt-2 text-sm text-slate-600">Cargando correos relacionados...</p>
                </div>
              ) : relatedEmails.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    {relatedEmails.map(email => (
                      <div 
                        key={email.id} 
                        onClick={() => handleViewEmail(email)}
                        className="border-b border-slate-200 last:border-b-0 p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {email.unread && (
                                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                              )}
                              <h4 className="font-semibold text-slate-900 text-sm truncate">{email.subject || '(Sin asunto)'}</h4>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 truncate">De: {email.fromName || email.from}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{email.snippet}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-500">
                              {new Date(email.date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {email.hasAttachments && (
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500">
                                <PaperClipIcon className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                  <MailIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No hay correos vinculados</p>
                  <p className="text-sm text-slate-500 mt-1">Los correos relacionados aparecerán aquí automáticamente</p>
                </div>
              )}
            </div>
          )}
        {activeTab === 'documents' && <ProjectDocuments documents={documents} onUpdateDocuments={onUpdateDocuments} />}
        {activeTab === 'notes' && <ProjectNotes notes={notes} onAddNote={onAddNote} onUpdateNote={onUpdateNote} onDeleteNote={onDeleteNote} />}
        {activeTab === 'members' && <ProjectMembers projectAssignees={project.assignees} allTeamMembers={teamMembers} onUpdateAssignees={onUpdateAssignees} />}
        {activeTab === 'expenses' && <ExpensesManager 
                                        expenses={expenses}
                                        onAddExpense={onAddExpense}
                                        onUpdateExpense={onUpdateExpense}
                                        onDeleteExpense={onDeleteExpense}
                                        teamMembers={teamMembers}
                                        operationId={project.id}
                                        bankAccounts={bankAccounts}
                                    />}
        {activeTab === 'invoices' && <InvoicesManager 
                                        project={project}
                                        operationId={project.id}
                                        invoices={invoices}
                                        payments={payments}
                                        onAddInvoice={onAddInvoice}
                                        onUpdateInvoice={onUpdateInvoice}
                                        onDeleteInvoice={onDeleteInvoice}
                                        client={client}
                                        bankAccounts={bankAccounts}
                                        initialEditInvoiceId={initialEditInvoiceId}
                                        initialViewInvoiceId={initialViewInvoiceId}
                                        onInitialIntentConsumed={handleInitialIntentConsumed}
                                     />}
        {activeTab === 'payments' && <PaymentsManager
                                        operationId={project.id}
                                        payments={payments}
                                        invoices={invoices}
                                        onAddPayment={onAddPayment}
                                        onUpdatePayment={onUpdatePayment}
                                        onDeletePayment={onDeletePayment}
                                        bankAccounts={bankAccounts}
                                     />}
        {activeTab === 'commissions' && <CommissionsManager 
            project={project}
            invoices={invoices}
            payments={payments}
            expenses={expenses}
            onUpdateCommissionHistory={onUpdateCommissionHistory}
        />}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        @keyframes pulse-strong {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.2);
            }
        }
        .animate-pulse-strong {
            animation: pulse-strong 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
    `}</style>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteOperation}
        title="Eliminar Operación"
        message={`¿Estás seguro de que deseas eliminar la operación "${project.projectName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />

      {/* Modal de visualización de correo */}
      <EmailViewer
        email={selectedEmailForView}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
};

export default OperationDetailPage;