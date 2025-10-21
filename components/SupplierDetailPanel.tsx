


import React from 'react';
import { Supplier } from '../pages/DashboardPage';
import { XIcon } from './icons/XIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { StarIcon } from './icons/StarIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { DocumentPdfIcon } from './icons/DocumentPdfIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { DocumentCsvIcon } from './icons/DocumentCsvIcon';
import { FileIcon } from './icons/FileIcon';

interface SupplierDetailPanelProps {
    supplier: Supplier;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    operationalSummary: { total: number; active: number; completed: number };
}

const FileTypeIcon: React.FC<{ fileType: string, className?: string }> = ({ fileType, className = "w-8 h-8 text-gray-500" }) => {
    if (fileType.startsWith('image/')) return <PhotoIcon className={className} />;
    if (fileType === 'application/pdf') return <DocumentPdfIcon className={className} />;
    if (fileType.includes('spreadsheet') || fileType.includes('csv')) return <DocumentCsvIcon className={className} />;
    if (fileType.startsWith('application/vnd.openxmlformats-officedocument') || fileType === 'application/msword') return <DocumentTextIcon className={className} />;
    return <FileIcon className={className} />;
};

// Add className prop for consistency and future-proofing.
const DetailItem: React.FC<{ label: string, value?: string, children?: React.ReactNode, className?: string }> = ({ label, value, children, className = '' }) => (
    <div className={className}>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {children || <p className="text-sm text-gray-800 font-semibold">{value || 'N/A'}</p>}
    </div>
);

const SupplierDetailPanel: React.FC<SupplierDetailPanelProps> = ({ supplier, onClose, onEdit, onDelete, operationalSummary }) => {
    return (
        <div className="fixed inset-0 z-40" onClick={onClose}>
            <div
                className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{supplier.name}</h2>
                        <p className="text-sm text-gray-500">{supplier.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={onEdit} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><EditIcon className="w-5 h-5" /></button>
                         <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><TrashIcon className="w-5 h-5" /></button>
                         <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XIcon className="w-6 h-6 text-gray-600" /></button>
                    </div>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Primary Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="Contact Person" value={supplier.contactPerson} />
                            <DetailItem label="Email" value={supplier.email} />
                            <DetailItem label="Phone" value={supplier.phone} />
                            <DetailItem label="Internal Rating">
                                <div className="flex items-center">
                                    {/* Wrap StarIcon in a span to provide a key, as the icon component doesn't accept a key prop directly. */}
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span key={i}>
                                            <StarIcon className={`w-5 h-5 ${i < (supplier.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                                        </span>
                                    ))}
                                </div>
                            </DetailItem>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Services Offered</h3>
                        <div className="flex flex-wrap gap-2">
                            {supplier.services && supplier.services.length > 0 ? supplier.services.map(service => (
                                <span key={service} className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">{service}</span>
                            )) : <p className="text-sm text-gray-500">No specific services listed.</p>}
                        </div>
                    </div>

                     <div className="p-4 bg-gray-50 rounded-lg border">
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Operational Summary</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-xl font-bold text-gray-800">{operationalSummary.total}</p><p className="text-xs text-gray-500">Total Ops</p></div>
                            <div><p className="text-xl font-bold text-blue-600">{operationalSummary.active}</p><p className="text-xs text-gray-500">Active</p></div>
                            <div><p className="text-xl font-bold text-green-600">{operationalSummary.completed}</p><p className="text-xs text-gray-500">Completed</p></div>
                        </div>
                        <button className="mt-4 w-full text-center text-sm font-medium text-blue-600 hover:underline">View all operations</button>
                    </div>

                    <div>
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Contacts</h3>
                        <div className="space-y-3">
                            {supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts.map(contact => (
                                <div key={contact.id} className="p-3 border rounded-lg bg-white flex items-center gap-4">
                                    <UserCircleIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-800">{contact.name} <span className="text-xs text-gray-500 font-normal ml-1">({contact.role})</span></p>
                                        <p className="text-gray-600">{contact.email} | {contact.phone}</p>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-gray-500 text-center py-4">No additional contacts listed.</p>}
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Documents</h3>
                        <div className="space-y-3">
                            {supplier.documents && supplier.documents.length > 0 ? supplier.documents.map((doc, index) => (
                                <a 
                                    key={index} 
                                    href={doc.preview}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 border rounded-lg bg-white flex items-center gap-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-shrink-0">
                                        {doc.file.type.startsWith('image/') ?
                                            <img src={doc.preview} alt={doc.file.name} className="w-10 h-10 rounded object-cover" /> :
                                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                                <FileTypeIcon fileType={doc.file.type} className="w-6 h-6 text-gray-500" />
                                            </div>
                                        }
                                    </div>
                                    <div className="text-sm min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">{doc.file.name}</p>
                                        <p className="text-gray-500 text-xs">{(doc.file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </a>
                            )) : <p className="text-sm text-gray-500 text-center py-4">No documents uploaded for this supplier.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierDetailPanel;