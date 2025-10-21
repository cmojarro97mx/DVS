import React, { useState, useEffect } from 'react';
import { Supplier, Contact, UploadedFile } from '../pages/DashboardPage';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { StarIcon } from './icons/StarIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { FileIcon } from './icons/FileIcon';

interface SupplierPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id'>) => void;
    supplierToEdit: Supplier | null;
}

const ALL_SERVICES = [
    'Freight Forwarding',
    'Customs Brokerage',
    'Ocean Freight (FCL)',
    'Ocean Freight (LCL)',
    'Air Freight',
    'Land Freight (FTL)',
    'Land Freight (LTL)',
    'Intermodal Transport',
    'Drayage Services',
    'Warehousing & Distribution',
    '3PL (Third-Party Logistics)',
    'Cold Chain Logistics',
    'Cargo Insurance',
    'Supply Chain Consulting',
    'Project Cargo',
    'Last-Mile Delivery',
    'Cross-Border Trucking',
    'RoRo (Roll-on/Roll-off)',
];

const StarRatingInput: React.FC<{ rating: number, setRating: (rating: number) => void }> = ({ rating, setRating }) => (
  <div className="flex items-center">
    {[1, 2, 3, 4, 5].map(star => (
      <button type="button" key={star} onClick={() => setRating(star)} className="p-1 focus:outline-none">
        <StarIcon className={`w-6 h-6 transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} />
      </button>
    ))}
  </div>
);

export const SupplierPanel: React.FC<SupplierPanelProps> = ({ isOpen, onClose, onSave, supplierToEdit }) => {
    const [formData, setFormData] = useState({
        name: '', category: '', contactPerson: '', email: '', phone: '',
    });
    const [contacts, setContacts] = useState<Partial<Contact>[]>([]);
    const [services, setServices] = useState<string[]>([]);
    const [rating, setRating] = useState(0);
    const [documents, setDocuments] = useState<UploadedFile[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (supplierToEdit) {
                setFormData({
                    name: supplierToEdit.name,
                    category: supplierToEdit.category,
                    contactPerson: supplierToEdit.contactPerson,
                    email: supplierToEdit.email,
                    phone: supplierToEdit.phone,
                });
                setContacts(supplierToEdit.contacts ? [...supplierToEdit.contacts] : []);
                setServices(supplierToEdit.services || []);
                setRating(supplierToEdit.rating || 0);
                setDocuments(supplierToEdit.documents || []);
            } else {
                setFormData({ name: '', category: '', contactPerson: '', email: '', phone: '' });
                setContacts([]);
                setServices([]);
                setRating(0);
                setDocuments([]);
            }
        }
        return () => {
            documents.forEach(doc => URL.revokeObjectURL(doc.preview));
        };
    }, [supplierToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceChange = (service: string) => {
        setServices(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]);
    };

    const handleContactChange = (index: number, field: keyof Contact, value: string) => {
        const newContacts = [...contacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setContacts(newContacts);
    };

    const addContact = () => {
        setContacts([...contacts, { id: `new-${Date.now()}`, name: '', role: '', email: '', phone: '' }]);
    };

    const removeContact = (index: number) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = [...e.target.files].map(file => ({
                file,
                preview: URL.createObjectURL(file),
            }));
            setDocuments(prev => [...prev, ...newFiles]);
        }
    };

    const removeDocument = (fileIndex: number) => {
        const fileToRemove = documents[fileIndex];
        URL.revokeObjectURL(fileToRemove.preview);
        setDocuments(prev => prev.filter((_, index) => index !== fileIndex));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalContacts = contacts.map((c, i) => ({ ...c, id: c.id?.startsWith('new-') ? `cs-${Date.now()}-${i}` : c.id })) as Contact[];
        onSave({ ...formData, contacts: finalContacts, services, rating, documents });
    };

    const baseInputClasses = "block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    const labelClasses = "text-sm font-medium text-gray-700";
    const subLabelClasses = "text-xs font-medium text-gray-600";


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40" onClick={onClose}>
            <div
                className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">{supplierToEdit ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XIcon className="w-6 h-6 text-gray-600" /></button>
                    </div>
                    <div className="p-6 space-y-5 flex-grow overflow-y-auto">
                        <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Primary Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Supplier Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={baseInputClasses} required /></div>
                            <div><label className={labelClasses}>Category</label><input type="text" name="category" value={formData.category} onChange={handleChange} className={baseInputClasses} required /></div>
                            <div><label className={labelClasses}>Primary Contact Person</label><input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className={baseInputClasses} required /></div>
                            <div><label className={labelClasses}>Primary Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={baseInputClasses} required /></div>
                            <div><label className={labelClasses}>Primary Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={baseInputClasses} /></div>
                        </div>

                        <h3 className="text-md font-semibold text-gray-700 border-b pb-2 pt-4">Logistics Details</h3>
                        <div>
                            <label className={labelClasses + " mb-2 block"}>Services Offered</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {ALL_SERVICES.map(service => (
                                    <label key={service} className="flex items-center text-sm p-1">
                                        <input type="checkbox" checked={services.includes(service)} onChange={() => handleServiceChange(service)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="ml-2 text-gray-700">{service}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses + " mb-1 block"}>Internal Rating</label>
                            <StarRatingInput rating={rating} setRating={setRating} />
                        </div>

                        <h3 className="text-md font-semibold text-gray-700 border-b pb-2 pt-4">Documents</h3>
                        <div>
                            <label className={labelClasses}>Attach Files</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="supplier-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                            <span>Upload files</span>
                                            <input id="supplier-file-upload" name="supplier-file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">Attach relevant supplier documents.</p>
                                </div>
                            </div>
                            {documents.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                                    {documents.map((doc, i) => (
                                        <div key={i} className="relative group border rounded-lg overflow-hidden aspect-square">
                                            <button type="button" onClick={() => removeDocument(i)} className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                            {doc.file.type.startsWith('image/') ?
                                                <img src={doc.preview} alt={doc.file.name} className="h-full w-full object-cover" /> :
                                                <div className="h-full w-full bg-gray-100 flex flex-col items-center justify-center p-2">
                                                    <FileIcon className="w-8 h-8 text-gray-400" />
                                                    <p className="text-xs text-center text-gray-500 mt-1 truncate w-full">{doc.file.name}</p>
                                                </div>
                                            }
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <h3 className="text-md font-semibold text-gray-700 border-b pb-2 pt-4">Additional Contacts</h3>
                        <div className="space-y-4">
                            {contacts.map((contact, index) => (
                                <div key={contact.id || index} className="p-3 bg-gray-50 rounded-lg border relative">
                                    <button type="button" onClick={() => removeContact(index)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div><label className={subLabelClasses}>Name</label><input type="text" value={contact.name} onChange={e => handleContactChange(index, 'name', e.target.value)} className={baseInputClasses} /></div>
                                        <div><label className={subLabelClasses}>Role</label><input type="text" value={contact.role} onChange={e => handleContactChange(index, 'role', e.target.value)} className={baseInputClasses} /></div>
                                        <div><label className={subLabelClasses}>Email</label><input type="email" value={contact.email} onChange={e => handleContactChange(index, 'email', e.target.value)} className={baseInputClasses} /></div>
                                        <div><label className={subLabelClasses}>Phone</label><input type="tel" value={contact.phone} onChange={e => handleContactChange(index, 'phone', e.target.value)} className={baseInputClasses} /></div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addContact} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                                <PlusIcon className="w-4 h-4 mr-1" /> Add Contact
                            </button>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Supplier</button>
                    </div>
                </form>
            </div>
        </div>
    );
};