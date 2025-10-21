import React, { useState, useEffect } from 'react';
import { View, UploadedFile } from './DashboardPage';
import { CompanyIcon } from '../components/icons/CompanyIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { MapPinIcon } from '../components/icons/MapPinIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { PhotoIcon } from '../components/icons/PhotoIcon';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { XIcon } from '../components/icons/XIcon';
import { AtSymbolIcon } from '../components/icons/AtSymbolIcon';
import { PhoneIcon } from '../components/icons/PhoneIcon';
import { GlobeAltIcon } from '../components/icons/GlobeAltIcon';
import { useAuth } from '../src/contexts/AuthContext';
import { organizationService } from '../src/services/organizationService';

interface CompanyProfilePageProps {
    setActiveView: (view: View) => void;
}

interface CompanyData {
    companyName: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    taxInfo: {
        legalName: string;
        taxId: string;
        vatId: string;
    };
    logo: UploadedFile | null;
}

type ActiveTab = 'general' | 'address' | 'tax' | 'branding';

const colors = [
  'bg-red-200 text-red-800', 'bg-yellow-200 text-yellow-800',
  'bg-green-200 text-green-800', 'bg-blue-200 text-blue-800',
  'bg-indigo-200 text-indigo-800', 'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800'
];
const getColorForString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};
const CompanyAvatar: React.FC<{ companyName: string }> = ({ companyName }) => {
  const initials = (companyName.split(' ').slice(0, 2).map(word => word[0]).join('') || companyName.substring(0, 2)).toUpperCase();
  const colorClass = getColorForString(companyName);
  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${colorClass}`}>
      {initials}
    </div>
  );
};


const TabButton: React.FC<{ label: string, icon: React.ElementType, isActive: boolean, onClick: () => void }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-200 rounded-lg ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 font-medium'
      }`}
    >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
    </button>
);

const DetailItem: React.FC<{ label: string; children: React.ReactNode; }> = ({ label, children }) => (
    <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className="text-sm text-gray-800 mt-1">{children}</div>
    </div>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="block w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
);

const CompanyProfilePage: React.FC<CompanyProfilePageProps> = ({ setActiveView }) => {
    const { user } = useAuth();
    const [companyData, setCompanyData] = useState<CompanyData>({
        companyName: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        taxInfo: {
            legalName: '',
            taxId: '',
            vatId: ''
        },
        logo: null
    });
    const [editedData, setEditedData] = useState<CompanyData>(companyData);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('general');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadOrganizationData();
    }, []);

    const loadOrganizationData = async () => {
        try {
            setIsLoading(true);
            const org = await organizationService.getCurrentOrganization();
            const data: CompanyData = {
                companyName: org.name || '',
                email: org.email || '',
                phone: org.phone || '',
                website: org.website || '',
                address: org.address || '',
                taxInfo: {
                    legalName: org.name || '',
                    taxId: org.rfc || '',
                    vatId: org.taxRegime || ''
                },
                logo: null
            };
            setCompanyData(data);
            setEditedData(data);
        } catch (err) {
            setError('Failed to load organization data');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedData(prev => ({ ...prev, address: e.target.value }));
    };
    
    const handleTaxInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedData(prev => ({ ...prev, taxInfo: { ...prev.taxInfo, [e.target.name]: e.target.value } }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (editedData.logo) {
                URL.revokeObjectURL(editedData.logo.preview);
            }
            setEditedData(prev => ({ ...prev, logo: { file, preview: URL.createObjectURL(file) } }));
        }
    };
    
    const removeLogo = () => {
        if (editedData.logo) {
             URL.revokeObjectURL(editedData.logo.preview);
             setEditedData(prev => ({ ...prev, logo: null }));
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError('');
            await organizationService.updateOrganization({
                name: editedData.companyName,
                email: editedData.email,
                phone: editedData.phone,
                website: editedData.website,
                address: editedData.address,
                rfc: editedData.taxInfo.taxId,
                taxRegime: editedData.taxInfo.vatId,
            });
            setCompanyData(editedData);
            setIsEditing(false);
        } catch (err) {
            setError('Failed to save organization data');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedData(companyData);
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Header */}
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <CompanyAvatar companyName={companyData.companyName} />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{companyData.companyName}</h2>
                                <p className="text-sm text-gray-500">{companyData.email}</p>
                            </div>
                        </div>
                        <div>
                             {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleCancel} disabled={isSaving} className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50">Cancel</button>
                                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-semibold border rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">
                                    <EditIcon className="w-4 h-4"/> Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Contact Email</p>
                            <div className="flex items-center gap-2">
                                <AtSymbolIcon className="w-5 h-5 text-gray-400" />
                                <span className="font-semibold text-gray-800 text-sm truncate">{companyData.email}</span>
                            </div>
                        </div>
                         <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Phone</p>
                            <div className="flex items-center gap-2">
                                <PhoneIcon className="w-5 h-5 text-gray-400" />
                                <span className="font-semibold text-gray-800 text-sm">{companyData.phone}</span>
                            </div>
                        </div>
                         <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Website</p>
                             <div className="flex items-center gap-2">
                                <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                                <a href={companyData.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline text-sm truncate">{companyData.website}</a>
                            </div>
                        </div>
                         <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Location</p>
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="w-5 h-5 text-gray-400" />
                                <span className="font-semibold text-gray-800 text-sm">{companyData.address.city}, {companyData.address.country}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                 <div className="border-t border-gray-200">
                    <nav className="flex items-center gap-2 p-2">
                        <TabButton label="General" icon={ClipboardListIcon} isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
                        <TabButton label="Address" icon={MapPinIcon} isActive={activeTab === 'address'} onClick={() => setActiveTab('address')} />
                        <TabButton label="Tax & Billing" icon={ShieldCheckIcon} isActive={activeTab === 'tax'} onClick={() => setActiveTab('tax')} />
                        <TabButton label="Branding" icon={PhotoIcon} isActive={activeTab === 'branding'} onClick={() => setActiveTab('branding')} />
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <DetailItem label="Company Name">{isEditing ? <TextInput name="companyName" value={editedData.companyName} onChange={handleFieldChange} /> : <p className="font-semibold">{companyData.companyName}</p>}</DetailItem>
                            <DetailItem label="Website">{isEditing ? <TextInput name="website" value={editedData.website} onChange={handleFieldChange} /> : <a href={companyData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{companyData.website}</a>}</DetailItem>
                            <DetailItem label="Contact Email">{isEditing ? <TextInput type="email" name="email" value={editedData.email} onChange={handleFieldChange} /> : <p>{companyData.email}</p>}</DetailItem>
                            <DetailItem label="Contact Phone">{isEditing ? <TextInput type="tel" name="phone" value={editedData.phone} onChange={handleFieldChange} /> : <p>{companyData.phone}</p>}</DetailItem>
                        </div>
                    )}
                    {activeTab === 'address' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <DetailItem label="Street Address">{isEditing ? <TextInput name="street" value={editedData.address.street} onChange={handleAddressChange} /> : <p>{companyData.address.street}</p>}</DetailItem>
                            <DetailItem label="City">{isEditing ? <TextInput name="city" value={editedData.address.city} onChange={handleAddressChange} /> : <p>{companyData.address.city}</p>}</DetailItem>
                            <DetailItem label="State / Province">{isEditing ? <TextInput name="state" value={editedData.address.state} onChange={handleAddressChange} /> : <p>{companyData.address.state}</p>}</DetailItem>
                            <DetailItem label="ZIP / Postal Code">{isEditing ? <TextInput name="zip" value={editedData.address.zip} onChange={handleAddressChange} /> : <p>{companyData.address.zip}</p>}</DetailItem>
                            <DetailItem label="Country">{isEditing ? <TextInput name="country" value={editedData.address.country} onChange={handleAddressChange} /> : <p>{companyData.address.country}</p>}</DetailItem>
                         </div>
                    )}
                    {activeTab === 'tax' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <DetailItem label="Legal Company Name">{isEditing ? <TextInput name="legalName" value={editedData.taxInfo.legalName} onChange={handleTaxInfoChange} /> : <p>{companyData.taxInfo.legalName}</p>}</DetailItem>
                            <DetailItem label="Tax ID / RFC">{isEditing ? <TextInput name="taxId" value={editedData.taxInfo.taxId} onChange={handleTaxInfoChange} /> : <p>{companyData.taxInfo.taxId}</p>}</DetailItem>
                            <DetailItem label="VAT ID">{isEditing ? <TextInput name="vatId" value={editedData.taxInfo.vatId} onChange={handleTaxInfoChange} /> : <p>{companyData.taxInfo.vatId}</p>}</DetailItem>
                        </div>
                    )}
                    {activeTab === 'branding' && (
                        <div>
                            <DetailItem label="Company Logo">
                                <div className="mt-2 flex items-center gap-8">
                                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
                                        {editedData.logo ? <img src={editedData.logo.preview} alt="Logo preview" className="max-w-full max-h-full object-contain" /> : <PhotoIcon className="w-12 h-12 text-gray-400" />}
                                    </div>
                                    {isEditing && (
                                        <div>
                                            <label htmlFor="logo-upload" className="cursor-pointer bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg border border-blue-200 hover:bg-blue-50">
                                                <UploadCloudIcon className="w-5 h-5 inline-block mr-2" />
                                                Upload Logo
                                            </label>
                                            <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                            {editedData.logo && <button onClick={removeLogo} className="ml-3 text-sm text-red-500 hover:underline">Remove</button>}
                                            <p className="text-xs text-gray-500 mt-2">Recommended: PNG with transparent background.</p>
                                        </div>
                                    )}
                                </div>
                            </DetailItem>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyProfilePage;