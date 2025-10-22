
import React from 'react';
import { View } from './DashboardPage';
import { MailIcon } from '../components/icons/MailIcon';
import { LinkIcon } from '../components/icons/LinkIcon';
import { AtSymbolIcon } from '../components/icons/AtSymbolIcon';
import { Banner } from '../components/Banner';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';

interface EmailHubPageProps {
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

const EmailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">{title}</h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const EmailHubPage: React.FC<EmailHubPageProps> = ({ setActiveView }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <Banner
                title="Email & Calendario"
                description="Gestiona tus conexiones de correo electrónico y analiza la actividad de tus mensajes."
                icon={MailIcon}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                <EmailSection title="Configuración">
                    <HubCard
                        title="Conexiones de Correo y Calendario"
                        description="Vincula tus cuentas de Google para sincronizar correos electrónicos y eventos de calendario automáticamente."
                        icon={LinkIcon}
                        onClick={() => setActiveView('integrations')}
                    />
                </EmailSection>

                <EmailSection title="Análisis">
                    <HubCard
                        title="Análisis de Correo"
                        description="Visualiza métricas y actividad de tus correos electrónicos sincronizados."
                        icon={AtSymbolIcon}
                        onClick={() => setActiveView('email-analysis')}
                    />
                </EmailSection>

            </div>
        </div>
    );
};

export default EmailHubPage;
