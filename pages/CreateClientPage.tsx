import React, { useState } from 'react';
import { Client, Currency, TaxInfo, UploadedFile } from './DashboardPage';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { DocumentPdfIcon } from '../components/icons/DocumentPdfIcon';
import { XIcon } from '../components/icons/XIcon';
import { clientsService } from '../src/services/clientsService';

interface CreateClientPageProps {
    onSave: () => void;
    onCancel: () => void;
}

const STEPS = [
    { name: 'Client Details', icon: UsersIcon },
    { name: 'Billing & Tax Info', icon: ShieldCheckIcon },
];

const FormField: React.FC<{ label: string, children: React.ReactNode, className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"/>;
const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"/>;
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"/>;


const CreateClientPage: React.FC<CreateClientPageProps> = ({ onSave, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<Omit<Client, 'id'>>({
        name: '', contactPerson: '', email: '', phone: '', address: '', status: 'Active',
        tier: 'Standard', currency: 'USD', contacts: [], documents: [],
        taxInfo: { rfc: '', taxRegime: '', cfdiUse: '', taxAddress: '', postalCode: '', billingEmail: '' },
        taxCertificate: undefined,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
     const handleTaxInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, taxInfo: { ...prev.taxInfo!, [name]: value } }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const taxCertificate = { file, preview: URL.createObjectURL(file) };
            setFormData(prev => ({ ...prev, taxCertificate }));
        }
    };
    
    const removeFile = () => {
        if (formData.taxCertificate) {
            URL.revokeObjectURL(formData.taxCertificate.preview);
        }
        setFormData(prev => ({ ...prev, taxCertificate: undefined }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSaving) return;
        
        try {
            setIsSaving(true);
            setError('');
            setSaveSuccess(false);
            
            await clientsService.create({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                contactPerson: formData.contactPerson,
                status: formData.status,
                tier: formData.tier,
                taxId: formData.taxInfo?.rfc,
            });
            
            setSaveSuccess(true);
            setTimeout(() => {
                onSave();
            }, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create client');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <button onClick={onCancel} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Clients
            </button>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
                 <div className="md:flex">
                     <div className="md:w-1/3 bg-gray-50/70 p-6 border-b md:border-b-0 md:border-r rounded-l-xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-8">New Client</h2>
                        <nav>
                            <ol>
                                {STEPS.map((step, stepIdx) => (
                                    <li key={step.name} className={`flex items-center p-3 rounded-lg ${currentStep === stepIdx ? 'bg-blue-50' : ''}`}>
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= stepIdx ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                            <step.icon className={`w-5 h-5 ${currentStep >= stepIdx ? 'text-white' : 'text-gray-600'}`} />
                                        </div>
                                        <span className={`ml-4 font-semibold text-sm ${currentStep >= stepIdx ? 'text-blue-700' : 'text-gray-700'}`}>{step.name}</span>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                     </div>
                     <div className="md:w-2/3 p-8 relative">
                        {isSaving && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-r-xl">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                    <p className="text-sm font-medium text-gray-700">Guardando cliente...</p>
                                </div>
                            </div>
                        )}
                        {saveSuccess && (
                            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                ¡Cliente creado exitosamente!
                            </div>
                        )}
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {currentStep === 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Client Details</h3>
                                    <FormField label="Client Name"><Input name="name" value={formData.name} onChange={handleChange} required /></FormField>
                                    <div className="grid grid-cols-2 gap-4">
                                      <FormField label="Contact Person"><Input name="contactPerson" value={formData.contactPerson} onChange={handleChange} required /></FormField>
                                      <FormField label="Status"><Select name="status" value={formData.status} onChange={handleChange}><option value="Active">Active</option><option value="Inactive">Inactive</option></Select></FormField>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Email"><Input type="email" name="email" value={formData.email} onChange={handleChange} required /></FormField>
                                        <FormField label="Phone"><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} /></FormField>
                                    </div>
                                    <FormField label="Address"><TextArea name="address" value={formData.address} onChange={handleChange} rows={3} /></FormField>
                                </div>
                            )}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-800">Billing & Tax Info</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <FormField label="Preferred Currency"><Select name="currency" value={formData.currency} onChange={handleChange}><option value="USD">USD</option><option value="MXN">MXN</option><option value="EUR">EUR</option></Select></FormField>
                                      <FormField label="Client Tier"><Select name="tier" value={formData.tier} onChange={handleChange}><option>Standard</option><option>Bronze</option><option>Silver</option><option>Gold</option></Select></FormField>
                                    </div>
                                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                        <h4 className="font-semibold text-gray-700 text-md">Información Fiscal (México)</h4>
                                        <FormField label="RFC"><Input name="rfc" value={formData.taxInfo?.rfc} onChange={handleTaxInfoChange} /></FormField>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField label="Régimen Fiscal"><Input name="taxRegime" value={formData.taxInfo?.taxRegime} onChange={handleTaxInfoChange} /></FormField>
                                            <FormField label="Uso de CFDI"><Input name="cfdiUse" value={formData.taxInfo?.cfdiUse} onChange={handleTaxInfoChange} /></FormField>
                                        </div>
                                         <div className="grid grid-cols-2 gap-4">
                                            <FormField label="Código Postal"><Input name="postalCode" value={formData.taxInfo?.postalCode} onChange={handleTaxInfoChange} /></FormField>
                                            <FormField label="Correo de Facturación"><Input type="email" name="billingEmail" value={formData.taxInfo?.billingEmail} onChange={handleTaxInfoChange} /></FormField>
                                         </div>
                                        <FormField label="Dirección Fiscal"><TextArea name="taxAddress" value={formData.taxInfo?.taxAddress} onChange={handleTaxInfoChange} rows={3} /></FormField>
                                    </div>
                                    <FormField label="Constancia de Situación Fiscal">
                                        {formData.taxCertificate ? (
                                            <div className="p-2 bg-gray-100 border rounded-md flex items-center justify-between">
                                                <div className="flex items-center gap-2"><DocumentPdfIcon className="w-5 h-5 text-red-600"/><span className="font-medium text-sm">{formData.taxCertificate.file.name}</span></div>
                                                <button type="button" onClick={removeFile} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><XIcon className="w-4 h-4"/></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-md">
                                                <div className="space-y-1 text-center"><UploadCloudIcon className="mx-auto h-8 w-8 text-gray-400" /><div className="flex text-sm text-gray-600"><label htmlFor="tax-cert-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"><span>Upload PDF</span><input id="tax-cert-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} /></label></div></div>
                                            </div>
                                        )}
                                    </FormField>
                                </div>
                            )}
                            <div className="flex justify-between pt-6 border-t">
                                {currentStep > 0 && <button type="button" onClick={() => setCurrentStep(0)} className="px-5 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-100">Previous</button>}
                                <div className="ml-auto">
                                    {currentStep < STEPS.length - 1 ? (
                                        <button type="button" onClick={() => setCurrentStep(1)} disabled={isSaving} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                                    ) : (
                                        <button 
                                            type="submit" 
                                            disabled={isSaving || saveSuccess} 
                                            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSaving && (
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            )}
                                            {saveSuccess && (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {isSaving ? 'Guardando...' : saveSuccess ? '¡Guardado!' : 'Guardar Cliente'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default CreateClientPage;