import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Client, Project, Contact, TaxInfo, Currency, FileSystemItem, UploadedFile, Payment, Invoice } from './DashboardPage';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { PaperClipIcon } from '../components/icons/PaperClipIcon';
import { BriefcaseIcon } from '../components/icons/BriefcaseIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { XIcon } from '../components/icons/XIcon';
import { FileIcon } from '../components/icons/FileIcon';
import { ProjectAvatar } from '../components/ProjectAvatar';
import { FolderIcon } from '../components/icons/FolderIcon';
import { FolderPlusIcon } from '../components/icons/FolderPlusIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { DocumentPdfIcon } from '../components/icons/DocumentPdfIcon';
import { PhotoIcon } from '../components/icons/PhotoIcon';
import { DocumentCsvIcon } from '../components/icons/DocumentCsvIcon';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';
import { ViewGridIcon } from '../components/icons/ViewGridIcon';
import { ViewListIcon } from '../components/icons/ViewListIcon';
import NewFolderModal from '../components/NewFolderModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { PaymentsIcon } from '../components/icons/PaymentsIcon';

interface ClientDetailPageProps {
    client: Client;
    onBack: () => void;
    onUpdateClient: (client: Client) => void;
    onDeleteRequest: () => void;
    isDeletable: boolean;
    projects: Project[];
    onViewOperation: (projectId: string) => void;
    payments: Payment[];
    invoices: Invoice[];
}

type Tab = 'overview' | 'billing' | 'contacts' | 'documents' | 'operations' | 'payments';

const colors = [
  'bg-red-200 text-red-800', 'bg-yellow-200 text-yellow-800', 'bg-green-200 text-green-800',
  'bg-blue-200 text-blue-800', 'bg-indigo-200 text-indigo-800', 'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800', 'bg-orange-200 text-orange-800',
];
const getColorForString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
  return colors[Math.abs(hash % colors.length)];
};
const ClientAvatar: React.FC<{ clientName: string }> = ({ clientName }) => {
  const initials = (clientName.split(' ').slice(0, 2).map(word => word[0]).join('') || clientName.substring(0, 2)).toUpperCase();
  const colorClass = getColorForString(clientName);
  return (<div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 ${colorClass}`} title={clientName}>{initials}</div>);
};
const TabButton: React.FC<{ label: string, icon: React.ElementType, isActive: boolean, onClick: () => void }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>{<Icon className="w-5 h-5" />}<span>{label}</span></button>
);
const DetailItem: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (<div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p><div className="text-sm text-gray-800 mt-1">{children}</div></div>);
const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => ( <input {...props} className="block w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"/> );
const TextAreaInput: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => ( <textarea {...props} className="block w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"/> );
const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => ( <select {...props} className="block w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"/> );

const SectionWrapper: React.FC<{ title: string; onEditToggle?: () => void; onSave?: () => void; onCancel?: () => void; isEditing?: boolean; children: React.ReactNode; headerContent?: React.ReactNode; }> = ({ title, onEditToggle, onSave, onCancel, isEditing, children, headerContent }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            {headerContent || (onEditToggle && onSave && onCancel && 
                (isEditing ? 
                    (<div className="flex items-center gap-2"><button onClick={onCancel} className="px-4 py-1.5 text-sm font-semibold border rounded-lg hover:bg-gray-100 text-gray-700">Cancel</button><button onClick={onSave} className="px-4 py-1.5 text-sm font-semibold border rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button></div>) 
                    : (<button onClick={onEditToggle} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"><EditIcon className="w-4 h-4"/> Edit</button>)
                )
            )}
        </div>
        {children}
    </div>
);

const ClientFinancialSummary: React.FC<{
    projects: Project[];
    invoices: Invoice[];
    payments: Payment[];
    currency: Currency;
}> = ({ projects, invoices, payments, currency }) => {
    const { totalInvoiced, totalPaid, balance } = useMemo(() => {
        const projectIds = new Set(projects.map(p => p.id));
        
        const clientInvoices = invoices.filter(inv => projectIds.has(inv.operationId));
        const clientPayments = payments.filter(pay => projectIds.has(pay.operationId));

        const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalPaid = clientPayments.reduce((sum, pay) => sum + pay.amount, 0);
        const balance = totalInvoiced - totalPaid;

        return { totalInvoiced, totalPaid, balance };
    }, [projects, invoices, payments]);

    const formatCurrency = (amount: number) => 
        new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm font-semibold text-blue-800">Total Invoiced</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(totalInvoiced)} <span className="text-lg">{currency}</span></p>
            </div>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm font-semibold text-green-800">Total Paid</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(totalPaid)} <span className="text-lg">{currency}</span></p>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800">Outstanding Balance</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{formatCurrency(balance)} <span className="text-lg">{currency}</span></p>
            </div>
        </div>
    );
};

const OverviewSection: React.FC<{ client: Client; onUpdate: (data: Partial<Client>) => void }> = ({ client, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ contactPerson: client.contactPerson, phone: client.phone, email: client.email, address: client.address, tier: client.tier, currency: client.currency });
    useEffect(() => setFormData({ contactPerson: client.contactPerson, phone: client.phone, email: client.email, address: client.address, tier: client.tier, currency: client.currency }), [client]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleSave = () => { onUpdate(formData); setIsEditing(false); };
    return (<SectionWrapper title="Client Overview" isEditing={isEditing} onEditToggle={() => setIsEditing(true)} onSave={handleSave} onCancel={() => setIsEditing(false)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DetailItem label="Contact Person">{isEditing ? <TextInput name="contactPerson" value={formData.contactPerson} onChange={handleChange} /> : <p className="font-medium">{client.contactPerson}</p>}</DetailItem>
            <DetailItem label="Phone">{isEditing ? <TextInput name="phone" value={formData.phone} onChange={handleChange} /> : <p>{client.phone}</p>}</DetailItem>
            <DetailItem label="Email">{isEditing ? <TextInput name="email" value={formData.email} onChange={handleChange} /> : <p>{client.email}</p>}</DetailItem>
            <DetailItem label="Address">{isEditing ? <TextAreaInput name="address" value={formData.address} onChange={handleChange} rows={3} /> : <p>{client.address}</p>}</DetailItem>
            <DetailItem label="Client Tier">{isEditing ? <SelectInput name="tier" value={formData.tier} onChange={handleChange}><option>Standard</option><option>Bronze</option><option>Silver</option><option>Gold</option></SelectInput> : <span className="text-sm font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">{client.tier}</span>}</DetailItem>
            <DetailItem label="Preferred Currency">{isEditing ? <SelectInput name="currency" value={formData.currency} onChange={handleChange}><option value="USD">USD</option><option value="MXN">MXN</option><option value="EUR">EUR</option></SelectInput> : <p>{client.currency}</p>}</DetailItem>
        </div>
    </SectionWrapper>);
};

const BillingSection: React.FC<{ taxInfo: TaxInfo | undefined; taxCertificate: UploadedFile | undefined; onUpdate: (data: Partial<Client>) => void }> = ({ taxInfo, taxCertificate, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const initialFormState = { rfc: '', taxRegime: '', cfdiUse: '', taxAddress: '', postalCode: '', billingEmail: '' };
    const [formData, setFormData] = useState(taxInfo || initialFormState);
    const [file, setFile] = useState<UploadedFile | null>(taxCertificate || null);
    
    useEffect(() => {
        setFormData(taxInfo || initialFormState);
        setFile(taxCertificate || null);
    }, [taxInfo, taxCertificate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const newFile = e.target.files[0];
            if(file) URL.revokeObjectURL(file.preview);
            setFile({ file: newFile, preview: URL.createObjectURL(newFile) });
        }
    };
    
    const removeFile = () => {
        if(file) URL.revokeObjectURL(file.preview);
        setFile(null);
    }
    
    const handleSave = () => { 
        onUpdate({ taxInfo: formData, taxCertificate: file || undefined }); 
        setIsEditing(false); 
    };

    return (<SectionWrapper title="Billing & Tax Information" isEditing={isEditing} onEditToggle={() => setIsEditing(true)} onSave={handleSave} onCancel={() => setIsEditing(false)}>
        <div className="space-y-8">
            <div>
                <h4 className="font-semibold text-gray-700 mb-4 text-md">Información Fiscal (México)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-gray-50/70 border border-gray-200/80 rounded-lg">
                    <DetailItem label="RFC">{isEditing ? <TextInput name="rfc" value={formData.rfc} onChange={handleChange} /> : <p>{taxInfo?.rfc || 'N/A'}</p>}</DetailItem>
                    <DetailItem label="Régimen Fiscal">{isEditing ? <TextInput name="taxRegime" value={formData.taxRegime} onChange={handleChange} /> : <p>{taxInfo?.taxRegime || 'N/A'}</p>}</DetailItem>
                    <DetailItem label="Uso de CFDI">{isEditing ? <TextInput name="cfdiUse" value={formData.cfdiUse} onChange={handleChange} /> : <p>{taxInfo?.cfdiUse || 'N/A'}</p>}</DetailItem>
                    <DetailItem label="Código Postal">{isEditing ? <TextInput name="postalCode" value={formData.postalCode} onChange={handleChange} /> : <p>{taxInfo?.postalCode || 'N/A'}</p>}</DetailItem>
                    <DetailItem label="Correo Electrónico de Facturación">{isEditing ? <TextInput type="email" name="billingEmail" value={formData.billingEmail} onChange={handleChange} /> : <p>{taxInfo?.billingEmail || 'N/A'}</p>}</DetailItem>
                    <DetailItem label="Dirección Fiscal">{isEditing ? <TextAreaInput name="taxAddress" value={formData.taxAddress} onChange={handleChange} rows={3} /> : <p className="whitespace-pre-wrap">{taxInfo?.taxAddress || 'N/A'}</p>}</DetailItem>
                </div>
            </div>
             <div className="pt-8 border-t">
                 <DetailItem label="Constancia de Situación Fiscal">
                     {isEditing ? (
                        <div className="mt-2">
                             {file ? (
                                <div className="p-2 bg-gray-100 border rounded-md flex items-center justify-between">
                                    <div className="flex items-center gap-2"><DocumentPdfIcon className="w-5 h-5 text-red-600"/><span className="font-medium text-sm">{file.file.name}</span></div>
                                    <button onClick={removeFile} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><XIcon className="w-4 h-4"/></button>
                                </div>
                             ) : (
                                <div className="flex justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-md">
                                    <div className="space-y-1 text-center"><UploadCloudIcon className="mx-auto h-8 w-8 text-gray-400" /><div className="flex text-sm text-gray-600"><label htmlFor="tax-cert-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"><span>Upload PDF</span><input id="tax-cert-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} /></label></div></div>
                                </div>
                             )}
                        </div>
                     ) : (
                         taxCertificate ? <a href={taxCertificate.preview} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline"><DocumentPdfIcon className="w-5 h-5 text-red-600" /><span>{taxCertificate.file.name}</span></a> : <p className="text-sm text-gray-500">No document uploaded.</p>
                     )}
                 </DetailItem>
             </div>
        </div>
    </SectionWrapper>);
};

const ContactsSection: React.FC<{ contacts: Contact[] | undefined; onUpdate: (data: Partial<Client>) => void }> = ({ contacts, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContacts, setEditedContacts] = useState(contacts || []);
    useEffect(() => setEditedContacts(contacts || []), [contacts]);
    const handleContactChange = (index: number, field: keyof Contact, value: string) => { setEditedContacts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c)); };
    const addContact = () => setEditedContacts(prev => [...prev, { id: `new-${Date.now()}`, name: '', role: '', email: '', phone: '' }]);
    const removeContact = (index: number) => setEditedContacts(prev => prev.filter((_, i) => i !== index));
    const handleSave = () => { onUpdate({ contacts: editedContacts }); setIsEditing(false); };
    return (<SectionWrapper title="Additional Contacts" isEditing={isEditing} onEditToggle={() => setIsEditing(true)} onSave={handleSave} onCancel={() => setIsEditing(false)}>
        <div className="space-y-4">
            {(isEditing ? editedContacts : contacts)?.map((contact, index) => (
                <div key={contact.id} className="p-4 bg-gray-50 rounded-lg border relative">
                    {isEditing && <button onClick={() => removeContact(index)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem label="Name">{isEditing ? <TextInput value={contact.name} onChange={e => handleContactChange(index, 'name', e.target.value)} /> : <p>{contact.name}</p>}</DetailItem>
                        <DetailItem label="Role">{isEditing ? <TextInput value={contact.role} onChange={e => handleContactChange(index, 'role', e.target.value)} /> : <p>{contact.role}</p>}</DetailItem>
                        <DetailItem label="Email">{isEditing ? <TextInput type="email" value={contact.email} onChange={e => handleContactChange(index, 'email', e.target.value)} /> : <p>{contact.email}</p>}</DetailItem>
                        <DetailItem label="Phone">{isEditing ? <TextInput type="tel" value={contact.phone} onChange={e => handleContactChange(index, 'phone', e.target.value)} /> : <p>{contact.phone}</p>}</DetailItem>
                    </div>
                </div>
            ))}
            {isEditing && <button onClick={addContact} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"><PlusIcon className="w-4 h-4" /> Add Contact</button>}
            {(!contacts || contacts.length === 0) && !isEditing && <p className="text-center py-8 text-gray-500">No additional contacts listed.</p>}
        </div>
    </SectionWrapper>);
};

const ClientDocumentsManager: React.FC<{ documents: FileSystemItem[]; onUpdateDocuments: (files: FileSystemItem[]) => void; }> = ({ documents, onUpdateDocuments }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<FileSystemItem | null>(null);
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
            } else { break; }
        }
        return [...path, ...breadcrumbs];
    }, [currentFolderId, documents]);

    const currentItems = useMemo(() => {
        return documents.filter(item => item.parentId === currentFolderId).sort((a, b) => {
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

    const FileTypeIcon: React.FC<{ fileType: string, className?: string }> = ({ fileType, className = "w-8 h-8 text-gray-500" }) => {
        if (fileType.startsWith('image/')) return <PhotoIcon className={className} />;
        if (fileType === 'application/pdf') return <DocumentPdfIcon className={className} />;
        if (fileType.includes('spreadsheet') || fileType.includes('csv')) return <DocumentCsvIcon className={className} />;
        if (fileType.startsWith('application/vnd.openxmlformats-officedocument') || fileType === 'application/msword') return <DocumentTextIcon className={className} />;
        return <FileIcon className={className} />;
    };
    
    return (<SectionWrapper title="Documents" headerContent={(
        <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><ViewGridIcon className="w-5 h-5" /></button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><ViewListIcon className="w-5 h-5" /></button>
            </div>
            <button onClick={() => setIsNewFolderModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"><FolderPlusIcon className="w-4 h-4" /> New Folder</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"><UploadCloudIcon className="w-4 h-4" /> Upload</button>
            <input type="file" multiple ref={fileInputRef} onChange={e => e.target.files && handleUploadFiles(e.target.files)} className="hidden" />
        </div>)}>
        <nav className="flex items-center text-sm font-medium text-gray-500 mb-4">
            {currentPath.map((part, index) => (
                <React.Fragment key={part.id || 'root'}>
                    <button onClick={() => setCurrentFolderId(part.id)} className="hover:text-blue-600 disabled:hover:text-gray-500 disabled:cursor-default" disabled={index === currentPath.length - 1}>{part.name}</button>
                    {index < currentPath.length - 1 && <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
                </React.Fragment>
            ))}
        </nav>
        <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleUploadFiles(e.dataTransfer.files); }} className={`min-h-[300px] rounded-lg p-2 transition-colors ${isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''}`}>
             {currentItems.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {currentItems.map(item => (<div key={item.id} onDoubleClick={() => item.type === 'folder' && setCurrentFolderId(item.id)} className="relative group rounded-lg border border-gray-200 p-3 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center"><div className="h-16 flex items-center justify-center">{item.type === 'folder' ? <FolderIcon className="w-12 h-12 text-yellow-500"/> : <FileTypeIcon fileType={item.file!.type} className="w-12 h-12" />}</div><p className="font-semibold text-xs text-gray-800 truncate w-full mt-2" title={item.name}>{item.name}</p><button onClick={() => setItemToDelete(item)} className="absolute top-1 right-1 p-1 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100"><TrashIcon className="w-4 h-4 text-red-600"/></button></div>))}
                    </div>
                ) : (
                    <div className="rounded-lg border">
                        {currentItems.map(item => (<div key={item.id} onDoubleClick={() => item.type === 'folder' && setCurrentFolderId(item.id)} className="grid grid-cols-[auto,1fr,auto] items-center gap-4 px-3 py-2 border-b last:border-b-0 hover:bg-blue-50/50 cursor-pointer group"><div className="flex-shrink-0">{item.type === 'folder' ? <FolderIcon className="w-6 h-6 text-yellow-500" /> : <FileTypeIcon fileType={item.file!.type} className="w-6 h-6 text-gray-500" />}</div><p className="font-semibold text-sm text-gray-800 truncate">{item.name}</p><button onClick={() => setItemToDelete(item)} className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100"><TrashIcon className="w-4 h-4 text-red-600"/></button></div>))}
                    </div>
                )
             ) : (<div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-500 p-10 border-2 border-dashed border-gray-300 rounded-xl"><UploadCloudIcon className="w-12 h-12 text-gray-300" /><h3 className="mt-4 text-md font-semibold text-gray-800">This folder is empty</h3><p className="mt-1 text-xs">Drag and drop files here to upload</p></div>)}
        </div>
        <NewFolderModal isOpen={isNewFolderModalOpen} onClose={() => setIsNewFolderModalOpen(false)} onCreate={handleCreateFolder} />
        <ConfirmationModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleDeleteItem} title={`Delete ${itemToDelete?.type}`}><p>Are you sure you want to delete "{itemToDelete?.name}"? {itemToDelete?.type === 'folder' && 'All contents will also be deleted.'} This cannot be undone.</p></ConfirmationModal>
    </SectionWrapper>);
};

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

const OperationsSection: React.FC<{ projects: Project[]; onViewOperation: (projectId: string) => void }> = ({ projects, onViewOperation }) => {
    return (<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {projects.length > 0 ? (
             <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white">
                    <tr className="border-b border-slate-300">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Team</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Deadline</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Progress</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {projects.map((project) => (
                      <tr key={project.id} onClick={() => onViewOperation(project.id)} className="hover:bg-slate-50 cursor-pointer group">
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-4">
                            <ProjectAvatar projectName={project.projectName} />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-slate-800 truncate" title={project.projectName}>{project.projectName}</p>
                              <p className="text-xs font-mono text-slate-500">{project.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center -space-x-2">
                            {project.assignees.slice(0, 3).map(assignee => (
                               <div key={assignee} className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 border-2 border-white ring-2 ring-slate-100" title={assignee}>
                                   {assignee.split(' ').map(n=>n[0]).join('')}
                               </div>
                            ))}
                            {project.assignees.length > 3 && (
                               <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 border-2 border-white ring-2 ring-slate-100">
                                   +{project.assignees.length - 3}
                               </div>
                            )}
                             {project.assignees.length === 0 && (
                               <div className="text-xs text-slate-400 italic">Unassigned</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium align-middle">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                <span>{project.deadline || 'N/A'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div className="bg-red-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 w-8 text-right">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                            <ChevronRightIcon className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        ) : <p className="text-center text-gray-500 py-16">No operations found for this client.</p>}
    </div>);
};

const ClientPaymentsSection: React.FC<{
    projects: Project[];
    payments: Payment[];
    invoices: Invoice[];
    onViewOperation: (projectId: string) => void;
}> = ({ projects, payments, invoices, onViewOperation }) => {
    const clientPayments = useMemo(() => {
        const projectIds = new Set(projects.map(p => p.id));
        const invoiceMap = new Map(invoices.map(i => [i.id, i.invoiceNumber]));
        return payments
            .filter(p => projectIds.has(p.operationId))
            .map(p => ({
                ...p,
                invoiceNumber: invoiceMap.get(p.invoiceId) || 'N/A',
                projectName: projects.find(proj => proj.id === p.operationId)?.projectName || 'Unknown',
            }))
            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    }, [projects, payments, invoices]);

    const formatCurrency = (amount: number, currency: string) => 
        new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

    return (
        <SectionWrapper title="Payment History">
            {clientPayments.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left bg-gray-50 text-xs text-gray-600 uppercase">
                            <tr>
                                <th className="px-4 py-2">Payment Date</th>
                                <th className="px-4 py-2">Invoice #</th>
                                <th className="px-4 py-2">Operation</th>
                                <th className="px-4 py-2">Method</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientPayments.map(p => (
                                <tr key={p.id} className="border-b hover:bg-gray-50 cursor-pointer group" onClick={() => onViewOperation(p.operationId)}>
                                    <td className="px-4 py-3 text-gray-700 font-medium">{p.paymentDate}</td>
                                    <td className="px-4 py-3 text-gray-700">{p.invoiceNumber}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <ProjectAvatar projectName={p.projectName} />
                                            <span className="font-semibold text-gray-800 group-hover:underline">
                                                {p.projectName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{p.paymentMethod}</td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(p.amount, p.currency)} <span className="text-xs font-normal text-gray-500">{p.currency}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center py-12 text-gray-500">No payments have been recorded for this client's operations.</p>
            )}
        </SectionWrapper>
    );
};


const ClientDetailPage: React.FC<ClientDetailPageProps> = ({ client, onBack, onUpdateClient, onDeleteRequest, isDeletable, projects, onViewOperation, payments, invoices }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const handlePartialUpdate = (updateData: Partial<Client>) => { onUpdateClient({ ...client, ...updateData }); };
    const handleDocumentsUpdate = (newDocs: FileSystemItem[]) => { handlePartialUpdate({ documents: newDocs }); };

    return (
        <div className="animate-fade-in space-y-6">
            <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Clients List
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                 <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <ClientAvatar clientName={client.name} />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{client.name}</h2>
                                <p className="text-sm text-gray-500">{client.email}</p>
                            </div>
                        </div>
                         <button onClick={onDeleteRequest} disabled={!isDeletable} title={!isDeletable ? 'Cannot delete client with active operations' : 'Delete client'} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed">
                            <TrashIcon className="w-4 h-4"/> Delete Client
                        </button>
                    </div>
                </div>
                <div className="border-t border-b border-gray-200">
                    <nav className="flex items-center gap-2 p-2 overflow-x-auto">
                        <TabButton label="Overview" icon={ClipboardListIcon} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <TabButton label="Billing" icon={ShieldCheckIcon} isActive={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
                        <TabButton label="Contacts" icon={UsersIcon} isActive={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} />
                        <TabButton label="Documents" icon={PaperClipIcon} isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
                        <TabButton label="Operations" icon={BriefcaseIcon} isActive={activeTab === 'operations'} onClick={() => setActiveTab('operations')} />
                        <TabButton label="Payments" icon={PaymentsIcon} isActive={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
                    </nav>
                </div>
                <div className="p-6 bg-slate-50/50">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <ClientFinancialSummary projects={projects} invoices={invoices} payments={payments} currency={client.currency || 'USD'} />
                            <OverviewSection client={client} onUpdate={handlePartialUpdate} />
                        </div>
                    )}
                    {activeTab === 'billing' && <BillingSection taxInfo={client.taxInfo} taxCertificate={client.taxCertificate} onUpdate={handlePartialUpdate} />}
                    {activeTab === 'contacts' && <ContactsSection contacts={client.contacts} onUpdate={handlePartialUpdate} />}
                    {activeTab === 'documents' && <ClientDocumentsManager documents={client.documents || []} onUpdateDocuments={handleDocumentsUpdate} />}
                    {activeTab === 'operations' && <OperationsSection projects={projects} onViewOperation={onViewOperation} />}
                    {activeTab === 'payments' && <ClientPaymentsSection projects={projects} payments={payments} invoices={invoices} onViewOperation={onViewOperation} />}
                </div>
            </div>
        </div>
    );
};

export default ClientDetailPage;