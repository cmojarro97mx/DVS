import React, { useState, useEffect, useMemo } from 'react';
import { Client, Project, Contact, UploadedFile, TaxInfo, Currency } from '../pages/DashboardPage';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { Banner } from './Banner';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { PlusIcon } from './icons/PlusIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { XIcon } from './icons/XIcon';
import { FileIcon } from './icons/FileIcon';
import { ProjectAvatar } from './ProjectAvatar';

interface ClientDetailPanelProps {
    client: Client;
    onBack: () => void;
    onUpdateClient: (client: Client) => void;
    onDeleteRequest: () => void;
    isDeletable: boolean;
    projects: Project[];
    onViewOperation: (projectId: string) => void;
}

type Tab = 'overview' | 'tax' | 'contacts' | 'documents' | 'operations';

const TabButton: React.FC<{ label: string, icon: React.ElementType, isActive: boolean, onClick: () => void }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
        isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
);

const DetailItem: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className="text-sm text-gray-800 mt-1">{children}</div>
    </div>
);

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

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="block w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
);
const TextAreaInput: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className="block w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
);
const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="block w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
);

const ClientDetailPanel: React.FC<ClientDetailPanelProps> = ({ client, onBack, onUpdateClient, onDeleteRequest, isDeletable, projects, onViewOperation }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editedClient, setEditedClient] = useState<Client>(client);
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        setEditedClient(client);
        setIsEditing(false); 
    }, [client]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedClient(prev => ({ ...prev, [name]: value }));
    };

    const handleTaxInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedClient(prev => ({ ...prev, taxInfo: { ...prev.taxInfo!, [name]: value } }));
    };

    const handleContactChange = (index: number, field: keyof Contact, value: string) => {
        setEditedClient(prev => {
            const newContacts = [...(prev.contacts || [])];
            newContacts[index] = { ...newContacts[index], [field]: value };
            return { ...prev, contacts: newContacts };
        });
    };

    const addContact = () => {
        const newContact: Contact = { id: `new-${Date.now()}`, name: '', role: '', email: '', phone: '' };
        setEditedClient(prev => ({ ...prev, contacts: [...(prev.contacts || []), newContact] }));
    };

    const removeContact = (index: number) => {
        setEditedClient(prev => ({ ...prev, contacts: prev.contacts?.filter((_, i) => i !== index) }));
    };

    const handleFileDrop = (files: FileList) => {
        const newFiles: UploadedFile[] = Array.from(files).map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setEditedClient(prev => ({ ...prev, documents: [...(prev.documents || []), ...newFiles]}));
    };

    const removeFile = (index: number) => {
        setEditedClient(prev => {
            const docToRemove = prev.documents?.[index];
            if (docToRemove) URL.revokeObjectURL(docToRemove.preview);
            return { ...prev, documents: prev.documents?.filter((_, i) => i !== index) };
        });
    };

    const handleSaveChanges = () => {
        onUpdateClient(editedClient);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedClient(client);
        setIsEditing(false);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Clients List
                </button>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                           <button onClick={handleCancel} className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-100 text-gray-700">Cancel</button>
                           <button onClick={handleSaveChanges} className="px-4 py-2 text-sm font-semibold border rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save Changes</button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">
                            <EditIcon className="w-4 h-4"/> Edit Client
                        </button>
                    )}
                    <button 
                        onClick={onDeleteRequest} 
                        disabled={!isDeletable}
                        title={!isDeletable ? 'Cannot delete client with active operations' : 'Delete client'}
                        className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <TrashIcon className="w-4 h-4"/> Delete
                    </button>
                </div>
            </div>

            <Banner title={client.name} description={client.email} icon={UserCircleIcon} />
            
            <div className="bg-gray-100/80 p-1 rounded-xl flex items-center gap-1">
                <TabButton label="Overview" icon={ClipboardListIcon} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <TabButton label="Tax Info" icon={ShieldCheckIcon} isActive={activeTab === 'tax'} onClick={() => setActiveTab('tax')} />
                <TabButton label="Contacts" icon={UsersIcon} isActive={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} />
                <TabButton label="Documents" icon={PaperClipIcon} isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
                <TabButton label="Operations" icon={BriefcaseIcon} isActive={activeTab === 'operations'} onClick={() => setActiveTab('operations')} />
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="Contact Person">{isEditing ? <TextInput name="contactPerson" value={editedClient.contactPerson} onChange={handleFieldChange} /> : <p>{client.contactPerson}</p>}</DetailItem>
                        <DetailItem label="Phone">{isEditing ? <TextInput name="phone" value={editedClient.phone} onChange={handleFieldChange} /> : <p>{client.phone}</p>}</DetailItem>
                        <DetailItem label="Email">{isEditing ? <TextInput name="email" value={editedClient.email} onChange={handleFieldChange} /> : <p>{client.email}</p>}</DetailItem>
                        <DetailItem label="Address">{isEditing ? <TextAreaInput name="address" value={editedClient.address} onChange={handleFieldChange} rows={3} /> : <p>{client.address}</p>}</DetailItem>
                        <DetailItem label="Client Tier">{isEditing ? <SelectInput name="tier" value={editedClient.tier} onChange={handleFieldChange}><option>Standard</option><option>Bronze</option><option>Silver</option><option>Gold</option></SelectInput> : <span className="text-sm font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">{client.tier}</span>}</DetailItem>
                        <DetailItem label="Preferred Currency">{isEditing ? <SelectInput name="currency" value={editedClient.currency} onChange={handleFieldChange}><option value="USD">USD</option><option value="MXN">MXN</option><option value="EUR">EUR</option></SelectInput> : <p>{client.currency}</p>}</DetailItem>
                        <DetailItem label="Status">{isEditing ? <SelectInput name="status" value={editedClient.status} onChange={handleFieldChange}><option>Active</option><option>Inactive</option></SelectInput> : <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{client.status}</span>}</DetailItem>
                    </div>
                )}
                {activeTab === 'tax' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem label="RFC">{isEditing ? <TextInput name="rfc" value={editedClient.taxInfo?.rfc} onChange={handleTaxInfoChange} /> : <p>{client.taxInfo?.rfc || 'N/A'}</p>}</DetailItem>
                        <DetailItem label="Tax Regime">{isEditing ? <TextInput name="taxRegime" value={editedClient.taxInfo?.taxRegime} onChange={handleTaxInfoChange} /> : <p>{client.taxInfo?.taxRegime || 'N/A'}</p>}</DetailItem>
                        <DetailItem label="CFDI Use">{isEditing ? <TextInput name="cfdiUse" value={editedClient.taxInfo?.cfdiUse} onChange={handleTaxInfoChange} /> : <p>{client.taxInfo?.cfdiUse || 'N/A'}</p>}</DetailItem>
                        <DetailItem label="Tax Address">{isEditing ? <TextAreaInput name="taxAddress" value={editedClient.taxInfo?.taxAddress} onChange={handleTaxInfoChange} rows={3} /> : <p>{client.taxInfo?.taxAddress || 'N/A'}</p>}</DetailItem>
                        <div className="md:col-span-2">
                            <DetailItem label="Tax Situation Certificate">
                                {isEditing ? <span>Editing this document is not supported yet.</span> : client.taxCertificate ? <a href={client.taxCertificate.preview} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline"><DocumentTextIcon className="w-5 h-5" /><span>{client.taxCertificate.file.name}</span></a> : <p className="text-sm text-gray-500">No document uploaded.</p>}
                            </DetailItem>
                        </div>
                    </div>
                )}
                {activeTab === 'contacts' && (
                    <div className="space-y-4">
                        {(isEditing ? editedClient.contacts : client.contacts)?.map((contact, index) => (
                            <div key={contact.id} className="p-4 bg-gray-50 rounded-lg border relative">
                                {isEditing && <button onClick={() => removeContact(index)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <DetailItem label="Name">{isEditing ? <TextInput value={contact.name} onChange={e => handleContactChange(index, 'name', e.target.value)} /> : <p>{contact.name}</p>}</DetailItem>
                                    <DetailItem label="Role">{isEditing ? <TextInput value={contact.role} onChange={e => handleContactChange(index, 'role', e.target.value)} /> : <p>{contact.role}</p>}</DetailItem>
                                    <DetailItem label="Email">{isEditing ? <TextInput value={contact.email} onChange={e => handleContactChange(index, 'email', e.target.value)} /> : <p>{contact.email}</p>}</DetailItem>
                                    <DetailItem label="Phone">{isEditing ? <TextInput value={contact.phone} onChange={e => handleContactChange(index, 'phone', e.target.value)} /> : <p>{contact.phone}</p>}</DetailItem>
                                </div>
                            </div>
                        ))}
                        {isEditing && <button onClick={addContact} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"><PlusIcon className="w-4 h-4" /> Add Contact</button>}
                        {(!client.contacts || client.contacts.length === 0) && !isEditing && <p className="text-center py-8 text-gray-500">No additional contacts listed.</p>}
                    </div>
                )}
                 {activeTab === 'documents' && (
                    <div className="space-y-4">
                        {isEditing && (
                            <div 
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileDrop(e.dataTransfer.files); }}
                                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                            >
                                <UploadCloudIcon className="w-12 h-12 text-gray-400"/>
                                <p className="mt-2 text-sm text-gray-600">Drag & drop files here or <span className="font-semibold text-blue-600">browse</span></p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(isEditing ? editedClient.documents : client.documents)?.map((doc, index) => (
                                <div key={index} className="relative group border rounded-lg overflow-hidden aspect-square">
                                    {isEditing && <button onClick={() => removeFile(index)} className="absolute top-1.5 right-1.5 z-10 bg-red-600 text-white rounded-full p-1"><XIcon className="w-3 h-3"/></button>}
                                    {doc.file.type.startsWith('image/') ? <img src={doc.preview} alt={doc.file.name} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gray-100 flex flex-col items-center justify-center p-2"><FileIcon className="w-10 h-10 text-gray-400" /><p className="text-xs text-center text-gray-500 mt-2 truncate w-full">{doc.file.name}</p></div>}
                                    <a href={doc.preview} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold">View</a>
                                </div>
                            ))}
                        </div>
                         {(!client.documents || client.documents.length === 0) && !isEditing && <p className="text-center py-8 text-gray-500">No documents uploaded for this client.</p>}
                    </div>
                )}
                {activeTab === 'operations' && (
                     <div className="overflow-x-auto">
                        {projects.length > 0 ? (
                             <table className="w-full text-sm">
                                <thead className="text-left bg-gray-50"><tr className="text-xs text-gray-600 uppercase"><th className="px-4 py-2">Project</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Assignees</th><th className="px-4 py-2">Deadline</th></tr></thead>
                                <tbody>
                                    {projects.map(p => (
                                        <tr key={p.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onViewOperation(p.id)}>
                                            <td className="px-4 py-3 flex items-center gap-3">
                                                <ProjectAvatar projectName={p.projectName}/>
                                                <span className="font-semibold text-gray-800">{p.projectName}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(p.status)}`}>{p.status}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center -space-x-2">
                                                    {p.assignees.slice(0, 3).map(assignee => (
                                                       <div key={assignee} className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white" title={assignee}>
                                                           {assignee.split(' ').map(n=>n[0]).join('')}
                                                       </div>
                                                    ))}
                                                    {p.assignees.length > 3 && (
                                                       <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 border-2 border-white">
                                                           +{p.assignees.length - 3}
                                                       </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{p.deadline}</td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        ) : <p className="text-center text-gray-500 py-8">No operations found for this client.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDetailPanel;