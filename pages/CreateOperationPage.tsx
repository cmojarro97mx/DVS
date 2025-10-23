import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Project, TeamMember, Currency, Client } from './DashboardPage';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { ShipmentInfoIcon } from '../components/icons/ShipmentInfoIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { FileIcon } from '../components/icons/FileIcon';
import { XIcon } from '../components/icons/XIcon';
import { PaperClipIcon } from '../components/icons/PaperClipIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { DocumentPdfIcon } from '../components/icons/DocumentPdfIcon';
import { PhotoIcon } from '../components/icons/PhotoIcon';
import { DocumentCsvIcon } from '../components/icons/DocumentCsvIcon';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';
import { operationsService } from '../src/services/operationsService';
import { clientsService } from '../src/services/clientsService';
import { GooglePlacesAutocomplete } from '../components/GooglePlacesAutocomplete';


interface CreateOperationPageProps {
    setActiveView: (view: View) => void;
    teamMembers: TeamMember[];
}

const STEPS = [
    { name: 'Project Details', description: 'Basic project information.', icon: ClipboardListIcon, fields: ['projectName', 'clientId', 'projectCategory', 'startDate', 'status', 'assignees', 'currency', 'operationType', 'shippingMode', 'insurance'] },
    { name: 'Shipment Information', description: 'Details about the transport.', icon: ShipmentInfoIcon, fields: [] },
    { name: 'Tracking & Dates', description: 'Key dates and tracking numbers.', icon: CalendarIcon, fields: [] },
    { name: 'Documents & Notes', description: 'Files and additional notes.', icon: PaperClipIcon, fields: [] },
];


export interface UploadedFile {
  file: File;
  preview: string;
}

const FileTypeIcon: React.FC<{ fileType: string, className?: string }> = ({ fileType, className = "w-8 h-8 text-gray-500" }) => {
    if (fileType.startsWith('image/')) return <PhotoIcon className={className} />;
    if (fileType === 'application/pdf') return <DocumentPdfIcon className={className} />;
    if (fileType.includes('spreadsheet') || fileType.includes('csv')) return <DocumentCsvIcon className={className} />;
    if (fileType.startsWith('application/vnd.openxmlformats-officedocument') || fileType === 'application/msword') return <DocumentTextIcon className={className} />;
    return <FileIcon className={className} />;
};

const FormField: React.FC<{ label: string; id: string; required?: boolean; error?: string; children: React.ReactNode; className?: string }> = ({ label, id, required, error, children, className }) => (
    <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }>((props, ref) => {
    return (
        <input
            ref={ref}
            {...props}
            className={`block w-full px-3 py-2 bg-gray-50/50 border rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${props.hasError ? 'border-red-500' : 'border-gray-300'} text-gray-900`}
        />
    );
});


const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }>((props, ref) => (
     <select
        ref={ref}
        {...props}
        className={`block w-full px-3 py-2 bg-gray-50/50 border rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${props.hasError ? 'border-red-500' : 'border-gray-300'} ${props.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {props.children}
    </select>
));


const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }>((props, ref) => (
    <textarea
        ref={ref}
        {...props}
        rows={3}
        className={`block w-full px-3 py-2 bg-gray-50/50 border rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${props.hasError ? 'border-red-500' : 'border-gray-300'}`}
    />
));

const validateStepLogic = (step: number, formData: any) => {
    const errors: { [key: string]: string } = {};
    const requiredFields = STEPS[step].fields;
    
    requiredFields.forEach(field => {
        if (field === 'assignees') {
            if (!formData.assignees || formData.assignees.length === 0) {
                 errors[field] = 'This field is required.';
            }
        } else if (!formData[field as keyof typeof formData]) {
            errors[field] = 'This field is required.';
        }
    });
    return errors;
};

const ExpressClientModal: React.FC<{ 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (data: Omit<Client, 'id'>) => void,
    initialName?: string,
}> = ({ isOpen, onClose, onSave, initialName = '' }) => {
    const [formData, setFormData] = useState({ name: initialName, contactPerson: '', email: '', phone: '', currency: 'USD' as Currency });

    useEffect(() => {
        setFormData(prev => ({ ...prev, name: initialName }));
    }, [initialName]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, address: '', status: 'Active' });
    };

    if (!isOpen) return null;

    const inputClasses = "block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">Create New Client</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5 text-gray-600"/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div><label className={labelClasses}>Client Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} required /></div>
                        <div><label className={labelClasses}>Primary Contact Person *</label><input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className={inputClasses} required /></div>
                        <div><label className={labelClasses}>Primary Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} required /></div>
                        <div><label className={labelClasses}>Primary Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} /></div>
                        <div>
                            <label className={labelClasses}>Preferred Currency *</label>
                            <select name="currency" value={formData.currency} onChange={handleChange} className={inputClasses} required>
                                <option value="USD">USD - US Dollar</option>
                                <option value="MXN">MXN - Mexican Peso</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Create and Use Client</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const CreateOperationPage: React.FC<CreateOperationPageProps> = ({ setActiveView, teamMembers }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [highestStepVisited, setHighestStepVisited] = useState(0);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(true);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const clientDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setIsLoadingClients(true);
            const data = await clientsService.getAll();
            setClients(data);
        } catch (err) {
            console.error('Failed to load clients:', err);
        } finally {
            setIsLoadingClients(false);
        }
    };

    const [formData, setFormData] = useState<Omit<Project, 'id' | 'progress'>>({
        projectName: '', projectCategory: '', 
        startDate: new Date().toISOString().split('T')[0], 
        deadline: '', 
        status: 'Planning', 
        assignees: teamMembers.length > 0 ? [teamMembers[0].id] : [], 
        currency: 'USD',
        clientId: '',
        operationType: '', insurance: '', shippingMode: '', courrier: '',
        bookingTracking: '', etd: '', eta: '', pickupDate: '',
        pickupAddress: '', deliveryAddress: '', mbl_awb: '', hbl_awb: '', notes: '',
    });

    useEffect(() => {
        return () => { files.forEach(file => URL.revokeObjectURL(file.preview)) };
    }, [files]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
                setIsClientDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'assignees') {
            const selectedOptions = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
            setFormData(prev => ({ ...prev, assignees: selectedOptions }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    
    const filteredClients = useMemo(() => {
        if (!clientSearch) return clients;
        return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
    }, [clients, clientSearch]);

    const handleSelectClient = (client: Client) => {
        setFormData(prev => ({ ...prev, clientId: client.id, currency: client.currency || 'USD' }));
        setClientSearch(client.name);
        setIsClientDropdownOpen(false);
        // Clear currency error if exists
        if (errors.currency) {
            setErrors(prev => ({ ...prev, currency: '' }));
        }
    };

    const handleSaveNewClient = async (clientData: Omit<Client, 'id'>) => {
        try {
            const newClient = await clientsService.create({
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                contactPerson: clientData.contactPerson || '',
                address: clientData.address,
                status: clientData.status,
            });
            const fullClient: Client = {
                ...newClient,
                contactPerson: newClient.contactPerson || '',
                phone: newClient.phone || '',
                address: newClient.address || '',
            };
            handleSelectClient(fullClient);
            setIsClientModalOpen(false);
            await loadClients();
        } catch (err) {
            console.error('Failed to create client:', err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // Use spread syntax to correctly type `e.target.files` as an array of `File` objects.
            const newFiles = [...e.target.files].map(file => ({
                file,
                preview: URL.createObjectURL(file),
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };
    
    const removeFile = (fileIndex: number) => {
        const fileToRemove = files[fileIndex];
        URL.revokeObjectURL(fileToRemove.preview);
        setFiles(prev => prev.filter((_, index) => index !== fileIndex));
    };
    
    const validateCurrentStep = () => {
        const validationErrors = validateStepLogic(currentStep, formData);
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const nextStep = () => {
        if (validateCurrentStep()) {
            const nextStepIndex = Math.min(currentStep + 1, STEPS.length - 1);
            setCurrentStep(nextStepIndex);
            setHighestStepVisited(Math.max(highestStepVisited, nextStepIndex));
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));
    
    const goToStep = (stepIndex: number) => {
        if (stepIndex <= highestStepVisited) {
            setCurrentStep(stepIndex);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }
        
        // Only allow submission if we're on the last step
        if (currentStep !== STEPS.length - 1) {
            return;
        }
        
        let allErrors: { [key: string]: string } = {};
        STEPS.forEach((step, index) => {
            const stepErrors = validateStepLogic(index, formData);
            allErrors = {...allErrors, ...stepErrors};
        });

        setErrors(allErrors);

        if (Object.keys(allErrors).length === 0) {
            try {
                setIsSaving(true);
                setSaveError('');
                
                const newOperation = await operationsService.create({
                    projectName: formData.projectName,
                    projectCategory: formData.projectCategory,
                    startDate: formData.startDate,
                    deadline: formData.deadline,
                    status: formData.status,
                    operationType: formData.operationType,
                    insurance: formData.insurance,
                    shippingMode: formData.shippingMode,
                    courrier: formData.courrier,
                    bookingTracking: formData.bookingTracking,
                    etd: formData.etd,
                    eta: formData.eta,
                    pickupDate: formData.pickupDate,
                    pickupAddress: formData.pickupAddress,
                    deliveryAddress: formData.deliveryAddress,
                    mbl_awb: formData.mbl_awb,
                    hbl_awb: formData.hbl_awb,
                    notes: formData.notes,
                    currency: formData.currency,
                    clientId: formData.clientId,
                    assignees: formData.assignees,
                });
                
                console.log('Operation created successfully:', newOperation);
                
                // Upload files if any
                if (files.length > 0) {
                    console.log(`Uploading ${files.length} files to operation ${newOperation.id}`);
                    for (const fileItem of files) {
                        try {
                            await operationsService.uploadDocument(newOperation.id, fileItem.file);
                        } catch (uploadErr) {
                            console.error('Failed to upload file:', fileItem.file.name, uploadErr);
                        }
                    }
                }
                
                setActiveView('logistics-projects');
            } catch (err) {
                setSaveError(err instanceof Error ? err.message : 'Failed to create operation');
                console.error(err);
            } finally {
                setIsSaving(false);
            }
        } else {
            const firstErrorStep = STEPS.findIndex(step => 
                step.fields.some(field => (allErrors as any)[field])
            );
            if (firstErrorStep !== -1) {
                setCurrentStep(firstErrorStep);
            }
        }
    };

    const projectCategories = ["Ocean Freight Import", "Ocean Freight Export", "Air Freight Import", "Air Freight Export", "Inland Freight", "Customs Import", "Customs Export", "Virtual Customs Export", "Warehousing", "Last Mile Delivery", "Supply Chain Consulting", "Cargo Insurance", "Other"];
    const operationTypes = ["Land Transportation", "Maritime Shipping", "Air Freight", "Rail Freight", "Intermodal Transportation", "Reverse Logistics", "Cross-Docking", "Last Mile Delivery", "Order Fulfillment", "Inventory Management", "Customs Brokerage", "Freight Forwarding", "Distribution Services", "Warehousing Operations", "Transportation Management", "Company Verification"];
    const shippingModes = ["Air Freight", "Sea Freight", "Land Freight", "Rail Freight", "Intermodal", "Not Applicable"];
    const insuranceOptions = ["Insured", "Not Insured", "Client has own insurance"];
    const logisticsStatuses = ["Planning", "Booked", "In Transit", "On Hold", "Delayed", "Customs Clearance", "Delivered", "Canceled"];

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <button onClick={() => setActiveView('operations')} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Operations
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-5xl mx-auto">
                <div className="md:flex">
                    <div className="md:w-1/3 bg-gray-50/50 p-6 border-b md:border-b-0 md:border-r border-gray-200 rounded-l-xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-8">New Operation</h2>
                        <nav>
                             <ol className="relative">
                                {STEPS.map((step, stepIdx) => {
                                    const isCurrent = stepIdx === currentStep;
                                    const canNavigate = stepIdx <= highestStepVisited;
                                    const isCompleted = stepIdx < currentStep;

                                    return (
                                        <li key={step.name} className="relative flex items-start pb-8 last:pb-0">
                                            {stepIdx < STEPS.length - 1 && (
                                                <div aria-hidden="true" className={`absolute left-[23.5px] top-6 h-full w-0.5 transition-colors duration-300 ${isCompleted || isCurrent ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                            )}
                                            <button 
                                                type="button" 
                                                onClick={() => goToStep(stepIdx)} 
                                                disabled={!canNavigate} 
                                                className={`w-full text-left p-2 rounded-lg transition-all duration-200 flex items-center ${canNavigate ? 'cursor-pointer' : 'cursor-not-allowed'} ${isCurrent ? '' : (canNavigate ? 'hover:bg-gray-100/70' : '')}`}
                                            >
                                                <div className="relative z-10 flex-shrink-0">
                                                    <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isCurrent ? 'bg-blue-600 shadow-md' : (isCompleted ? 'bg-blue-600' : 'bg-gray-200')}`}>
                                                        <step.icon className={`w-6 h-6 transition-colors duration-300 ${isCurrent || isCompleted ? 'text-white' : 'text-gray-600'}`} />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <h3 className={`font-bold text-base transition-colors duration-300 ${isCurrent ? 'text-blue-700' : 'text-gray-800'}`}>{step.name}</h3>
                                                    <p className={`text-sm transition-colors duration-300 text-gray-500`}>{step.description}</p>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                    </div>

                    <div className="md:w-2/3 p-8 flex flex-col">
                         <div className="flex flex-col flex-grow">
                             <div className="flex-grow">
                                <div key={currentStep}>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-6">{STEPS[currentStep].name}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                        {currentStep === 0 && (<>
                                            <FormField label="Project Name" id="projectName" required className="md:col-span-2" error={errors.projectName}>
                                                <Input name="projectName" value={formData.projectName} onChange={handleChange} required hasError={!!errors.projectName} />
                                            </FormField>
                                            <FormField label="Client" id="clientId" required className="md:col-span-2" error={errors.clientId}>
                                                <div className="relative" ref={clientDropdownRef}>
                                                    <Input
                                                        name="clientSearch"
                                                        value={formData.clientId ? (clients.find(c => c.id === formData.clientId)?.name || clientSearch) : clientSearch}
                                                        onChange={(e) => {
                                                            setClientSearch(e.target.value);
                                                            setIsClientDropdownOpen(true);
                                                            if (formData.clientId) {
                                                                setFormData(prev => ({ ...prev, clientId: '' }));
                                                            }
                                                        }}
                                                        onFocus={() => setIsClientDropdownOpen(true)}
                                                        placeholder="Search for a client..."
                                                        autoComplete="off"
                                                        required
                                                        hasError={!!errors.clientId}
                                                    />
                                                    {isClientDropdownOpen && (
                                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                            {filteredClients.map(client => (
                                                                <div key={client.id} onClick={() => handleSelectClient(client)} className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer">
                                                                    {client.name}
                                                                </div>
                                                            ))}
                                                            {clientSearch && filteredClients.length === 0 && (
                                                                <div onClick={() => setIsClientModalOpen(true)} className="px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer font-semibold flex items-center gap-2">
                                                                    <PlusIcon className="w-4 h-4" /> Create new client "{clientSearch}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormField>
                                            <FormField label="Project Category" id="projectCategory" required error={errors.projectCategory}>
                                                <Select name="projectCategory" value={formData.projectCategory} onChange={handleChange} required hasError={!!errors.projectCategory}>
                                                    <option value="" disabled>Select a category</option>
                                                    {projectCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </Select>
                                            </FormField>
                                            <FormField label="Status" id="status" required error={errors.status}>
                                                <Select name="status" value={formData.status} onChange={handleChange} required hasError={!!errors.status}>
                                                    <option value="" disabled>Select a status</option>
                                                    {logisticsStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                </Select>
                                            </FormField>
                                            <FormField label="Start Date" id="startDate" required error={errors.startDate}>
                                                <Input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required hasError={!!errors.startDate} />
                                            </FormField>
                                            <FormField label="Deadline" id="deadline" error={errors.deadline}>
                                                <Input type="date" name="deadline" value={formData.deadline} onChange={handleChange} hasError={!!errors.deadline} />
                                            </FormField>
                                            <FormField label="Project Currency" id="currency" required className="md:col-span-2" error={errors.currency}>
                                                <Select name="currency" value={formData.currency} onChange={handleChange} required hasError={!!errors.currency} disabled={!!formData.clientId}>
                                                    <option value="USD">USD</option>
                                                    <option value="MXN">MXN</option>
                                                    <option value="EUR">EUR</option>
                                                </Select>
                                                {formData.clientId && <p className="mt-1 text-xs text-gray-500">Currency is set based on the selected client</p>}
                                            </FormField>
                                            <FormField label="Assigned To" id="assignees" required className="md:col-span-2" error={errors.assignees}>
                                                <Select name="assignees" value={formData.assignees} onChange={handleChange} required hasError={!!errors.assignees} multiple>
                                                    {teamMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                                                </Select>
                                            </FormField>
                                            <FormField label="Operation Type" id="operationType" required error={errors.operationType}>
                                                <Select name="operationType" value={formData.operationType} onChange={handleChange} required hasError={!!errors.operationType}>
                                                    <option value="">Select an option</option>
                                                    {operationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                </Select>
                                            </FormField>
                                            <FormField label="Shipping Mode" id="shippingMode" required error={errors.shippingMode}>
                                                <Select name="shippingMode" value={formData.shippingMode} onChange={handleChange} required hasError={!!errors.shippingMode}>
                                                    <option value="">Select a mode</option>
                                                    {shippingModes.map(m => <option key={m} value={m}>{m}</option>)}
                                                </Select>
                                            </FormField>
                                            <FormField label="Insurance" id="insurance" required className="md:col-span-2" error={errors.insurance}>
                                                <Select name="insurance" value={formData.insurance} onChange={handleChange} required hasError={!!errors.insurance}>
                                                    <option value="">Select an option</option>
                                                    {insuranceOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                                </Select>
                                            </FormField>
                                        </>)}
                                        {currentStep === 1 && (<>
                                            <FormField label="Courrier" id="courrier"><Input name="courrier" value={formData.courrier} onChange={handleChange} /></FormField>
                                            <FormField label="Pick Up Address" id="pickupAddress" className="md:col-span-2">
                                                <GooglePlacesAutocomplete
                                                    name="pickupAddress"
                                                    value={formData.pickupAddress}
                                                    onChange={(value) => setFormData(prev => ({ ...prev, pickupAddress: value }))}
                                                    placeholder="Start typing to search for an address..."
                                                />
                                            </FormField>
                                            <FormField label="Delivery Address" id="deliveryAddress" className="md:col-span-2">
                                                <GooglePlacesAutocomplete
                                                    name="deliveryAddress"
                                                    value={formData.deliveryAddress}
                                                    onChange={(value) => setFormData(prev => ({ ...prev, deliveryAddress: value }))}
                                                    placeholder="Start typing to search for an address..."
                                                />
                                            </FormField>
                                        </>)}
                                        {currentStep === 2 && (<>
                                            <FormField label="Booking / Shipment Tracking" id="bookingTracking" className="md:col-span-2"><Input name="bookingTracking" value={formData.bookingTracking} onChange={handleChange} /></FormField>
                                            <FormField label="Pick Up Date" id="pickupDate"><Input type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} /></FormField>
                                            <div/>
                                            <FormField label="ETD" id="etd"><Input type="date" name="etd" value={formData.etd} onChange={handleChange} /></FormField>
                                            <FormField label="ETA" id="eta"><Input type="date" name="eta" value={formData.eta} onChange={handleChange} /></FormField>
                                            <FormField label="MBL / AWB" id="mbl_awb"><Input name="mbl_awb" value={formData.mbl_awb} onChange={handleChange} /></FormField>
                                            <FormField label="HBL / AWB" id="hbl_awb"><Input name="hbl_awb" value={formData.hbl_awb} onChange={handleChange} /></FormField>
                                        </>)}
                                        {currentStep === 3 && (<>
                                            <FormField label="Files" id="files" className="md:col-span-2">
                                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                                    <div className="space-y-1 text-center"><UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" /><div className="flex text-sm text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"><span>Upload files</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} /></label><p className="pl-1">or drag and drop</p></div><p className="text-xs text-gray-500">Any file type. Important documents for the operation.</p></div>
                                                </div>
                                                {files.length > 0 && (<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">{files.map((f, i) => (<div key={i} className="relative group border rounded-lg overflow-hidden aspect-square"><button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><XIcon className="w-3 h-3" /></button>{f.file.type.startsWith('image/') ? <img src={f.preview} alt={f.file.name} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gray-100 flex flex-col items-center justify-center p-2"><FileTypeIcon fileType={f.file.type} className="w-8 h-8 text-gray-400" /><p className="text-xs text-center text-gray-500 mt-1 truncate w-full">{f.file.name}</p></div>}<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" /></div>))}</div>)}
                                            </FormField>
                                            <FormField label="Notes" id="notes" className="md:col-span-2"><Textarea name="notes" value={formData.notes} onChange={handleChange} /></FormField>
                                        </>)}
                                    </div>
                                </div>
                            </div>
                            {saveError && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {saveError}
                                </div>
                            )}
                            <div className="flex justify-between gap-4 pt-4 mt-8 border-t border-gray-200">
                                <div>{currentStep > 0 && (<button type="button" onClick={prevStep} disabled={isSaving} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>)}</div>
                                <div>{currentStep < STEPS.length - 1 ? (<button type="button" onClick={nextStep} disabled={isSaving} className="px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Next</button>) : (
                                    <button type="button" onClick={() => handleSubmit()} disabled={isSaving} className="px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                        {isSaving ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : 'Save Operation'}
                                    </button>
                                )}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ExpressClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onSave={handleSaveNewClient} initialName={clientSearch} />
        </div>
    );
};

export default CreateOperationPage;