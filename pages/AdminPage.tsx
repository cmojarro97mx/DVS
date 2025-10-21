import React from 'react';
import { View } from './DashboardPage';
import { UsersIcon } from '../components/icons/UsersIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { Banner } from '../components/Banner';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { FingerPrintIcon } from '../components/icons/FingerPrintIcon';
import { CompanyIcon } from '../components/icons/CompanyIcon';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';


interface AdminPageProps {
    setActiveView: (view: View) => void;
}

const HubCard: React.FC<{
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    disabled?: boolean;
}> = ({ title, description, icon: Icon, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center p-4 bg-white rounded-xl border border-slate-200 transition-all duration-200 group hover:border-blue-500 hover:shadow-md hover:-translate-y-1 disabled:bg-slate-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:border-slate-200 disabled:hover:-translate-y-0"
    >
        <div className={`p-3 rounded-lg border transition-colors ${disabled ? 'bg-slate-100 border-slate-200' : 'bg-slate-100 group-hover:bg-blue-50 group-hover:border-blue-200'}`}>
            <Icon className={`w-6 h-6 transition-colors ${disabled ? 'text-slate-400' : 'text-slate-600 group-hover:text-blue-600'}`} />
        </div>
        <div className="ml-4 text-left flex-grow">
            <h3 className={`font-bold transition-colors ${disabled ? 'text-slate-500' : 'text-slate-800'}`}>{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        <ChevronRightIcon className={`w-6 h-6 transition-all ${disabled ? 'text-slate-300' : 'text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1'}`} />
    </button>
);

const AdminSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">{title}</h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);


const AdminPage: React.FC<AdminPageProps> = ({ setActiveView }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <Banner
                title="Company Administration"
                description="Manage your company's core settings, employees, and system configurations."
                icon={ShieldCheckIcon}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                <AdminSection title="People & Teams">
                    <HubCard
                        title="Employees"
                        description="Manage your team members and their information."
                        icon={UsersIcon}
                        onClick={() => setActiveView('employees')}
                    />
                     <HubCard
                        title="Roles & Permissions"
                        description="Define access levels for different team roles."
                        icon={FingerPrintIcon}
                        onClick={() => {}}
                        disabled
                    />
                </AdminSection>
                
                <AdminSection title="Company Settings">
                    <HubCard
                        title="Company Profile"
                        description="Update your business name, address, and branding."
                        icon={CompanyIcon}
                        onClick={() => setActiveView('company-profile')}
                    />
                    <HubCard
                        title="Billing & Subscription"
                        description="Manage your subscription plan and payment methods."
                        icon={CreditCardIcon}
                        onClick={() => {}}
                        disabled
                    />
                </AdminSection>

            </div>
        </div>
    );
};

export default AdminPage;