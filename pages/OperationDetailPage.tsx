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
import { ClockIcon } from '../components/icons/ClockIcon';

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
    operationId: string;
}> = ({ documents, onUpdateDocuments, operationId }) => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<FileSystemItem | null>(null);
    const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
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

    const handleUploadFiles = async (files: FileList) => {
        if (!files || files.length === 0) return;
        
        setIsUploading(true);
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const uploadedDoc = await operationsService.uploadDocument(operationId, file);
                return {
                    id: uploadedDoc.id,
                    name: uploadedDoc.name,
                    type: 'file' as const,
                    parentId: currentFolderId,
                    url: uploadedDoc.url,
                    size: uploadedDoc.size,
                    mimeType: uploadedDoc.mimeType,
                };
            });
            
            const uploadedFiles = await Promise.all(uploadPromises);
            onUpdateDocuments([...documents, ...uploadedFiles]);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Error al subir archivos. Por favor, intenta nuevamente.');
        } finally {
            setIsUploading(false);
        }
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
            {isUploading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-xl">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-sm font-medium text-gray-700">Subiendo archivos a Backblaze...</p>
                    </div>
                </div>
            )}
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
                    <button onClick={() => setIsNewFolderModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200" disabled={isUploading}><FolderPlusIcon className="w-4 h-4" /> New Folder</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isUploading}>
                        {isUploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <UploadCloudIcon className="w-4 h-4" />}
                        {isUploading ? 'Subiendo...' : 'Upload'}
                    </button>
                    <input type="file" multiple ref={fileInputRef} onChange={e => e.target.files && handleUploadFiles(e.target.files)} className="hidden" disabled={isUploading} />
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
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return PhotoIcon;
        if (fileType === 'application/pdf') return DocumentPdfIcon;
        if (fileType.includes('spreadsheet') || fileType.includes('csv')) return DocumentCsvIcon;
        if (fileType.startsWith('application/vnd.openxmlformats-officedocument') || fileType === 'application/msword') return DocumentTextIcon;
        return FileIcon;
    };

    const handleAddClick = async () => {
        if (isSaving || !newNoteContent.trim()) return;
        
        setIsSaving(true);
        try {
            await onAddNote(newNoteContent, selectedFile || undefined);
            setNewNoteContent('');
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error saving note:', error);
            alert(`Error al guardar la nota: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveEdit = () => {
        if (editingNote && editingNote.content.trim()) {
            onUpdateNote(editingNote.id, editingNote.content);
            setEditingNote(null);
        }
    };

    const handleDeleteClick = (noteId: string) => {
        if(window.confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
            onDeleteNote(noteId);
        }
    };

    const sortedNotes = [...notes].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-red-500',
            'bg-yellow-500',
            'bg-teal-500'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const formatRelativeTime = (date: Date) => {
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMinutes < 1) return 'Justo ahora';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        if (diffInHours < 24) return `Hace ${diffInHours}h`;
        if (diffInDays < 7) return `Hace ${diffInDays}d`;
        
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-4">
            {/* Header with Stats - Compacto */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <NotesIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Notas</h3>
                        <p className="text-xs text-gray-600">
                            {notes.length === 0 ? 'Sin notas' : `${notes.length} ${notes.length === 1 ? 'nota' : 'notas'}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Add Note Card - Compacto */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                    <PencilIcon className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Nueva Nota</h3>
                </div>
                <div className="p-4">
                    <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Escribe tu nota aquí..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm bg-white text-gray-900 placeholder-gray-400 transition-all"
                        rows={3}
                    />
                    
                    {/* File Attachment Section */}
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="note-file-input"
                            />
                            <label
                                htmlFor="note-file-input"
                                className="cursor-pointer px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                            >
                                <PaperClipIcon className="w-3.5 h-3.5" />
                                Archivo
                            </label>
                            {selectedFile && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md">
                                    {React.createElement(getFileIcon(selectedFile.type), { className: "w-4 h-4 text-blue-600" })}
                                    <span className="text-xs text-gray-700 max-w-[150px] truncate">{selectedFile.name}</span>
                                    <button
                                        onClick={handleRemoveFile}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleAddClick} 
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                            disabled={!newNoteContent.trim() || isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <PencilIcon className="w-3.5 h-3.5" />
                                    <span>Publicar</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Notes Timeline */}
            {sortedNotes.length > 0 ? (
                <div className="space-y-1 relative">
                    <div className="flex items-center gap-2 px-2 mb-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Historial de Notas</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    </div>
                    
                    {/* Timeline line */}
                    <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-transparent"></div>
                    
                    {sortedNotes.map((note, index) => (
                        <div key={note.id} className="relative pl-20 pb-8">
                            {/* Timeline node */}
                            <div className={`absolute left-6 top-6 w-5 h-5 rounded-full border-4 ${getAvatarColor(note.author)} border-white shadow-lg z-10`}></div>
                            
                            {/* Note card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
                                {editingNote?.id === note.id ? (
                                    <div className="p-6">
                                        <div className="mb-4">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Editando nota
                                            </label>
                                            <textarea 
                                                value={editingNote.content} 
                                                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })} 
                                                className="w-full p-4 border border-gray-300 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none shadow-sm" 
                                                rows={5}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setEditingNote(null)} 
                                                className="px-5 py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={handleSaveEdit} 
                                                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Guardar Cambios
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-5 py-3.5 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 ${getAvatarColor(note.author)} rounded-lg flex items-center justify-center shadow-sm`}>
                                                        <span className="text-white font-bold text-xs">{getInitials(note.author)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{note.author}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                                                            <time className="text-xs text-gray-600">
                                                                {note.createdAt ? formatRelativeTime(new Date(note.createdAt)) : ''}
                                                            </time>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditingNote({ id: note.id, content: note.content })}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                        title="Editar nota"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(note.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                        title="Eliminar nota"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-5 py-4">
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                            
                                            {/* Attachment display */}
                                            {note.attachmentUrl && note.attachmentName && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <a
                                                        href={note.attachmentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all group"
                                                    >
                                                        <PaperClipIcon className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                                                        <span className="text-sm text-gray-700 group-hover:text-blue-600 font-medium">{note.attachmentName}</span>
                                                        <DownloadIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 px-6 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <NotesIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">No hay notas registradas</h4>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Comienza a documentar el progreso de esta operación agregando tu primera nota usando el formulario superior.
                    </p>
                </div>
            )}
        </div>
    );
};

const ProjectMembers: React.FC<{
  projectAssignees: string[];
  allTeamMembers: TeamMember[];
  onUpdateAssignees: (newAssignees: string[]) => void;
}> = ({ projectAssignees, allTeamMembers, onUpdateAssignees }) => {
  const [memberToAdd, setMemberToAdd] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Log para debugging
  console.log('👥 ProjectMembers rendered:', {
    projectAssignees,
    allTeamMembers: allTeamMembers.length,
    teamMemberIds: allTeamMembers.map(m => m.id)
  });

  // Obtener miembros asignados válidos
  const assignedMembers = React.useMemo(() => {
    if (!projectAssignees || !Array.isArray(projectAssignees)) {
      console.log('⚠️ projectAssignees no es array válido:', projectAssignees);
      return [];
    }

    const members = projectAssignees
      .filter(id => id && typeof id === 'string' && id !== 'Unknown')
      .map(employeeId => {
        const member = allTeamMembers.find(m => m.id === employeeId);
        if (!member) {
          console.log(`⚠️ No se encontró miembro para ID: ${employeeId}`);
        }
        return member;
      })
      .filter(Boolean) as TeamMember[];

    console.log('✅ Miembros asignados encontrados:', members);
    return members;
  }, [projectAssignees, allTeamMembers]);

  // Obtener miembros disponibles (no asignados)
  const availableMembers = React.useMemo(() => {
    const assignedIds = assignedMembers.map(m => m.id);
    return allTeamMembers.filter(m => !assignedIds.includes(m.id));
  }, [assignedMembers, allTeamMembers]);

  const handleAddMember = async () => {
    if (!memberToAdd) return;

    try {
      setIsLoading(true);
      console.log('➕ Agregando miembro:', memberToAdd);
      
      const currentAssigneeIds = assignedMembers.map(m => m.id);
      const newAssignees = [...currentAssigneeIds, memberToAdd];
      
      console.log('📤 Enviando assignees:', newAssignees);
      await onUpdateAssignees(newAssignees);
      
      setMemberToAdd('');
      console.log('✅ Miembro agregado exitosamente');
    } catch (error) {
      console.error('❌ Error al agregar miembro:', error);
      alert('Error al agregar miembro. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = allTeamMembers.find(m => m.id === memberId);
    const memberName = member?.name || 'este miembro';
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${memberName} de esta operación?`)) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('➖ Eliminando miembro:', memberId);
      
      const newAssignees = assignedMembers
        .filter(m => m.id !== memberId)
        .map(m => m.id);
      
      console.log('📤 Enviando assignees:', newAssignees);
      await onUpdateAssignees(newAssignees);
      
      console.log('✅ Miembro eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error al eliminar miembro:', error);
      alert('Error al eliminar miembro. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Miembros Asignados</h3>
        <div className="flex items-center gap-2">
          <select
            value={memberToAdd}
            onChange={(e) => setMemberToAdd(e.target.value)}
            disabled={isLoading || availableMembers.length === 0}
            className="block w-48 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {availableMembers.length > 0 ? 'Seleccionar miembro...' : 'No hay miembros disponibles'}
            </option>
            {availableMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
          <button
            onClick={handleAddMember}
            disabled={!memberToAdd || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {assignedMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assignedMembers.map(member => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500 truncate">{member.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={isLoading}
                  className="ml-2 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  title={`Eliminar a ${member.name}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
            <UserCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">No hay miembros asignados</p>
            <p className="text-xs text-gray-500">Selecciona un miembro del equipo para asignarlo a esta operación</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface OperationHealthProps {
  project: Project;
  tasks: Record<string, Task>;
  documents: FileSystemItem[];
  emails: EmailMessage[];
  invoices: Invoice[];
  payments: Payment[];
}

const OperationHealth: React.FC<OperationHealthProps> = ({ project, tasks, documents, emails, invoices, payments }) => {
  const calculateHealth = () => {
    let totalScore = 0;
    const issues: { type: 'warning' | 'error' | 'success'; message: string }[] = [];

    const progressScore = project.progress;
    totalScore += progressScore * 0.25;
    if (progressScore < 30) {
      issues.push({ type: 'warning', message: 'Progreso bajo: ' + progressScore + '%' });
    } else if (progressScore >= 80) {
      issues.push({ type: 'success', message: 'Excelente progreso: ' + progressScore + '%' });
    }

    const taskArray = Object.values(tasks);
    const completedTasks = taskArray.filter(t => t.status === 'Done').length;
    const taskCompletionRate = taskArray.length > 0 ? (completedTasks / taskArray.length) * 100 : 100;
    totalScore += taskCompletionRate * 0.20;
    const pendingTasks = taskArray.length - completedTasks;
    if (pendingTasks > 10) {
      issues.push({ type: 'warning', message: pendingTasks + ' tareas pendientes' });
    }

    let dateScore = 100;
    const today = new Date();
    if (project.deadline) {
      const deadline = new Date(project.deadline);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline < 0) {
        dateScore = 0;
        issues.push({ type: 'error', message: 'Operación vencida hace ' + Math.abs(daysUntilDeadline) + ' días' });
      } else if (daysUntilDeadline < 3) {
        dateScore = 30;
        issues.push({ type: 'warning', message: 'Vence en ' + daysUntilDeadline + ' días' });
      } else if (daysUntilDeadline < 7) {
        dateScore = 60;
        issues.push({ type: 'warning', message: 'Vence en ' + daysUntilDeadline + ' días' });
      }
    }
    if (project.eta) {
      const eta = new Date(project.eta);
      const daysUntilETA = Math.ceil((eta.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilETA < 0 && project.status !== 'Delivered') {
        dateScore = Math.min(dateScore, 20);
        issues.push({ type: 'error', message: 'ETA excedido - En tránsito' });
      }
    }
    totalScore += dateScore * 0.20;

    const documentScore = documents.length >= 3 ? 100 : (documents.length / 3) * 100;
    totalScore += documentScore * 0.15;
    if (documents.length === 0) {
      issues.push({ type: 'warning', message: 'Sin documentos cargados' });
    }

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
    const paymentRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 100;
    totalScore += paymentRate * 0.15;
    if (totalInvoiced > 0 && paymentRate < 50) {
      issues.push({ type: 'warning', message: 'Pagos pendientes: ' + paymentRate.toFixed(0) + '% cobrado' });
    }

    const recentEmails = emails.filter(e => {
      const emailDate = new Date(e.receivedAt || e.sentAt);
      const daysSince = (today.getTime() - emailDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });
    const emailScore = recentEmails.length > 0 ? 100 : 50;
    totalScore += emailScore * 0.05;

    return {
      score: Math.round(totalScore),
      issues: issues.slice(0, 5),
      metrics: {
        progress: progressScore,
        tasks: taskCompletionRate,
        dates: dateScore,
        documents: documentScore,
        payments: paymentRate,
      }
    };
  };

  const health = calculateHealth();

  const getHealthColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600', bar: 'bg-green-500' };
    if (score >= 60) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600', bar: 'bg-blue-500' };
    if (score >= 40) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600', bar: 'bg-yellow-500' };
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600', bar: 'bg-red-500' };
  };

  const healthColor = getHealthColor(health.score);

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Buena';
    if (score >= 40) return 'Regular';
    return 'Requiere Atención';
  };

  return (
    <div className={`rounded-xl shadow-sm border ${healthColor.border} ${healthColor.bg} p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg bg-white border ${healthColor.border}`}>
            <CpuChipIcon className={`w-6 h-6 ${healthColor.icon}`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${healthColor.text}`}>
              Salud de la Operación: {getHealthLabel(health.score)}
            </h3>
            <p className="text-sm text-gray-600">Análisis en tiempo real</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${healthColor.text}`}>{health.score}%</div>
          <div className="text-xs text-gray-500">Score General</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Salud General</span>
          <span>{health.score}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className={`h-3 rounded-full ${healthColor.bar} transition-all duration-500`} style={{ width: `${health.score}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Progreso</div>
          <div className="text-lg font-bold text-gray-800">{Math.round(health.metrics.progress)}%</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Tareas</div>
          <div className="text-lg font-bold text-gray-800">{Math.round(health.metrics.tasks)}%</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Fechas</div>
          <div className="text-lg font-bold text-gray-800">{Math.round(health.metrics.dates)}%</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Documentos</div>
          <div className="text-lg font-bold text-gray-800">{Math.round(health.metrics.documents)}%</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Pagos</div>
          <div className="text-lg font-bold text-gray-800">{Math.round(health.metrics.payments)}%</div>
        </div>
      </div>

      {health.issues.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-2">Alertas y Recomendaciones:</div>
          <div className="space-y-2">
            {health.issues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2">
                {issue.type === 'error' && <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                {issue.type === 'warning' && <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />}
                {issue.type === 'success' && <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                <span className={`text-sm ${issue.type === 'error' ? 'text-red-700' : issue.type === 'warning' ? 'text-yellow-700' : 'text-green-700'}`}>
                  {issue.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
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
  const [emailSearchQuery, setEmailSearchQuery] = useState('');
  const [linkingCriteria, setLinkingCriteria] = useState<any>(null);
  const [selectedEmailForView, setSelectedEmailForView] = useState<any>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailsLoaded, setEmailsLoaded] = useState(false);

  const operationTasks = useMemo(() => {
    const filtered: Record<string, Task> = {};
    Object.entries(tasks).forEach(([id, task]) => {
      if (task.operationId === project.id) {
        filtered[id] = task;
      }
    });
    console.log('operationTasks filter - project.id:', project.id);
    console.log('operationTasks filter - all tasks:', tasks);
    console.log('operationTasks filter - filtered tasks:', filtered);
    return filtered;
  }, [tasks, project.id]);

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
      if (activeTab === 'emails' && !emailsLoaded) {
        setLoadingEmails(true);
        try {
          const [emails, criteria] = await Promise.all([
            operationsService.getRelatedEmails(project.id),
            operationsService.getEmailLinkingCriteria(project.id)
          ]);
          setRelatedEmails(emails);
          setLinkingCriteria(criteria);
          setEmailsLoaded(true);
        } catch (error) {
          console.error('Error loading related emails:', error);
        } finally {
          setLoadingEmails(false);
        }
      }
    };
    loadRelatedEmails();
  }, [activeTab, project.id, emailsLoaded]);

  const filteredRelatedEmails = useMemo(() => {
    if (!emailSearchQuery.trim()) return relatedEmails;

    const query = emailSearchQuery.toLowerCase();
    return relatedEmails.filter(email => 
      email.subject?.toLowerCase().includes(query) ||
      email.fromName?.toLowerCase().includes(query) ||
      email.from?.toLowerCase().includes(query) ||
      email.snippet?.toLowerCase().includes(query)
    );
  }, [relatedEmails, emailSearchQuery]);


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
      <OperationHealth 
        project={project} 
        tasks={tasks} 
        documents={documents} 
        emails={emails} 
        invoices={invoices} 
        payments={payments} 
      />
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
      {project.needsAttention && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800">Operación requiere atención</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>Esta operación fue creada automáticamente y requiere revisión manual. Por favor verifica:</p>
                {project.missingFields && project.missingFields.length > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {project.missingFields.map((field, index) => (
                      <li key={index}>
                        {field === 'clientId' && 'Cliente no identificado - asignar manualmente'}
                        {field === 'assignees' && 'Sin empleados asignados - asignar equipo'}
                        {field === 'category' && 'Categoría de operación por definir'}
                        {field === 'deadline' && 'Fecha límite no establecida'}
                        {field === 'origin' && 'Origen no especificado'}
                        {field === 'destination' && 'Destino no especificado'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {project.autoCreated && !project.needsAttention && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                🤖 Esta operación fue creada automáticamente a partir de un correo electrónico.
              </p>
            </div>
          </div>
        </div>
      )}

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
                                      tasks={operationTasks}
                                      columns={columns}
                                      columnOrder={columnOrder}
                                      onSaveTask={onSaveTask}
                                      onDeleteTask={onDeleteTask}
                                      onUpdateColumns={onUpdateColumns}
                                  />}
        {activeTab === 'emails' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <MailIcon className="w-4 h-4 text-blue-600" />
                      Correos Vinculados {!loadingEmails && relatedEmails.length > 0 && `(${relatedEmails.length})`}
                    </h3>
                  </div>
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar correos..."
                      value={emailSearchQuery}
                      onChange={(e) => setEmailSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loadingEmails}
                    />
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {loadingEmails ? (
                    // Skeleton loader
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-3 animate-pulse">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              <div className="h-3 bg-gray-200 rounded w-full"></div>
                            </div>
                            <div className="flex-shrink-0 space-y-1">
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                              <div className="h-3 bg-gray-200 rounded w-12"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : relatedEmails.length > 0 ? (
                    filteredRelatedEmails.length > 0 ? (
                      filteredRelatedEmails.map(email => (
                        <div 
                          key={email.id} 
                          onClick={() => handleViewEmail(email)}
                          className="p-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <EmailAvatar name={email.fromName || email.from} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {email.unread && (
                                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                                )}
                                <h4 className={`text-sm truncate ${email.unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                                  {email.subject || '(Sin asunto)'}
                                </h4>
                                {email.hasAttachments && (
                                  <PaperClipIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-1">
                                <span className="font-medium">{email.fromName || email.from}</span>
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2">{email.snippet}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="text-xs text-gray-500 whitespace-nowrap">
                                {new Date(email.date).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: new Date(email.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                })}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(email.date).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <SearchIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No se encontraron correos</p>
                        <p className="text-sm text-gray-500 mt-1">Intenta con otros términos de búsqueda</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <MailIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium">No hay correos vinculados</p>
                      <p className="text-sm text-gray-500 mt-1">Los correos relacionados aparecerán aquí automáticamente</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        {activeTab === 'documents' && <ProjectDocuments documents={documents} onUpdateDocuments={onUpdateDocuments} operationId={project.id} />}
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