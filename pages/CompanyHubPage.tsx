
import React from 'react';
import { View } from './DashboardPage';
import { CompanyIcon } from '../components/icons/CompanyIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { Banner } from '../components/Banner';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';

interface CompanyHubPageProps {
    setActiveView: (view: View) => void;
}

const HubCard: React.FC<{
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
}> = ({ title, description, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center p-4 bg-white rounded-xl border border-slate-200 transition-all duration-200 group hover:border-blue-500 hover:shadow-md hover:-translate-y-1"
    >
        <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
            <Icon className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
        </div>
        <div className="ml-4 text-left flex-grow">
            <h3 className="font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        <ChevronRightIcon className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
    </button>
);

const CompanySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">{title}</h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const CompanyHubPage: React.FC<CompanyHubPageProps> = ({ setActiveView }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <Banner
                title="Gestión de Empresa"
                description="Administra la información de tu empresa y tu equipo de trabajo."
                icon={CompanyIcon}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                
                <CompanySection title="Información Corporativa">
                    <HubCard
                        title="Perfil de Empresa"
                        description="Gestiona la información general, dirección y datos fiscales de tu empresa."
                        icon={CompanyIcon}
                        onClick={() => setActiveView('company-profile')}
                    />
                </CompanySection>
                
                <CompanySection title="Recursos Humanos">
                    <HubCard
                        title="Empleados"
                        description="Administra tu equipo de trabajo y sus roles dentro de la organización."
                        icon={UsersIcon}
                        onClick={() => setActiveView('employees')}
                    />
                </CompanySection>

            </div>
        </div>
    );
};

export default CompanyHubPage;
