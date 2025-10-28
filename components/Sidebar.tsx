import React, { useState, useRef, useEffect } from 'react';
import { View } from '../pages/DashboardPage';
import { ChevronDoubleLeftIcon } from './icons/ChevronDoubleLeftIcon';
import { LogOutIcon } from './icons/LogOutIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ShipNowIcon } from './icons/ShipNowIcon';
import { useAuth } from '../src/contexts/AuthContext';

// Icons for navigation
import { DashboardIcon } from './icons/DashboardIcon';
import { TruckIcon } from './icons/TruckIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { CurrencyDollarOutlineIcon } from './icons/CurrencyDollarOutlineIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { FolderIcon } from './icons/FolderIcon';
import { FolderOpenIcon } from './icons/FolderOpenIcon';
import { LinkIcon } from './icons/LinkIcon';
import { CompanyIcon } from './icons/CompanyIcon';
import { AtSymbolIcon } from './icons/AtSymbolIcon';
import { MailIcon } from './icons/MailIcon';
import { CoinsIcon } from './icons/CoinsIcon';
import { InvoicesIcon } from './icons/InvoicesIcon';
import { PaymentsIcon } from './icons/PaymentsIcon';
import { ExpensesIcon } from './icons/ExpensesIcon';
import { BuildingLibraryIcon } from './icons/BuildingLibraryIcon';
import { DocumentMagnifyingGlassIcon } from '../components/icons/DocumentMagnifyingGlassIcon';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { UsersIcon } from './icons/UsersIcon';
import { CpuChipIcon } from './icons/CpuChipIcon';
import { BellIcon } from './icons/BellIcon';


interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void;
}

const NavItem: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isSidebarOpen: boolean;
    isSubItem?: boolean;
}> = ({ icon: Icon, label, isActive, onClick, isSidebarOpen, isSubItem = false }) => (
    <li className="relative group/navitem">
        <button
            onClick={onClick}
            className={`flex items-center w-full h-10 text-left rounded-lg transition-colors duration-200 relative ${
                isActive ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            } ${isSidebarOpen ? 'px-4' : 'justify-center'} ${isSubItem && isSidebarOpen ? 'pl-8' : ''}`}
        >
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-red-600 rounded-r-full"></div>}
            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-red-600' : 'text-gray-400 group-hover/navitem:text-gray-600'}`} />
            {isSidebarOpen && <span className={`ml-3 truncate font-medium text-sm ${isActive ? 'text-red-700' : 'text-gray-800'}`}>{label}</span>}
        </button>
        {!isSidebarOpen && (
            <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover/navitem:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] shadow-lg">
                {label}
            </div>
        )}
    </li>
);

const CollapsibleNavItem: React.FC<{
    icon: React.ElementType;
    label: string;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    activeView: View;
    setActiveView: (view: View) => void;
    mainView: View;
    subItems: { label: string; view: View; icon: React.ElementType }[];
}> = ({ icon: Icon, label, isSidebarOpen, setIsSidebarOpen, activeView, setActiveView, mainView, subItems }) => {
    const isParentActive = subItems.some(item => item.view === activeView) || activeView === mainView;
    const [isOpen, setIsOpen] = useState(isParentActive);

    useEffect(() => {
        if (isParentActive) {
            setIsOpen(true);
        }
    }, [isParentActive]);

    const handleToggle = () => {
        if (!isSidebarOpen) {
            setIsSidebarOpen(true);
            setIsOpen(true);
        } else {
            setIsOpen(!isOpen);
        }
    };

    return (
         <li className="relative group/collapsible">
            <button
                onClick={handleToggle}
                className={`flex items-center w-full h-10 text-left rounded-lg transition-colors duration-200 relative ${
                    isParentActive ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                } ${isSidebarOpen ? 'px-4' : 'justify-center'}`}
            >
                {isParentActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-red-600 rounded-r-full"></div>}
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isParentActive ? 'text-red-600' : 'text-gray-400 group-hover/collapsible:text-gray-600'}`} />
                {isSidebarOpen && <span className={`ml-3 truncate font-medium text-sm ${isParentActive ? 'text-red-700' : 'text-gray-800'}`}>{label}</span>}
                {isSidebarOpen && <ChevronDownIcon className={`w-5 h-5 ml-auto flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />}
            </button>
             {!isSidebarOpen && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover/collapsible:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] shadow-lg">
                    {label}
                </div>
            )}
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen && isSidebarOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <ul className="pt-1 space-y-1">
                        {subItems.map(item => (
                             <NavItem 
                                key={item.view}
                                icon={item.icon}
                                label={item.label}
                                isActive={activeView === item.view}
                                onClick={() => setActiveView(item.view)}
                                isSidebarOpen={isSidebarOpen}
                                isSubItem
                            />
                        ))}
                    </ul>
                </div>
            </div>
        </li>
    );
};

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

const UserAvatar: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const colorClass = getColorForString(name);
    return (
        <div className={`flex items-center justify-center font-bold rounded-full ${colorClass} ${className}`}>
            {initials}
        </div>
    );
};

const UserMenu: React.FC<{ onLogout: () => void, isSidebarOpen: boolean }> = ({ onLogout, isSidebarOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const userName = user?.name || "Usuario";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isSidebarOpen) {
        return (
             <div ref={menuRef} className="w-full flex justify-center py-2 relative">
                 <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-full hover:bg-gray-100 group/usermenu" 
                    title={userName}
                 >
                    <UserAvatar name={userName} className="w-9 h-9 text-sm" />
                 </button>
                 {!isOpen && (
                    <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover/usermenu:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] shadow-lg top-1/2 -translate-y-1/2">
                        {userName}
                    </div>
                 )}
                 {isOpen && (
                    <div className="absolute left-full ml-2 bottom-0 bg-white border border-gray-200 rounded-lg shadow-xl p-1 z-[60] min-w-[180px]">
                        <div className="px-3 py-2 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-800 truncate">{userName}</p>
                            <p className="text-xs text-gray-500">Admin</p>
                        </div>
                        <button onClick={() => { onLogout(); setIsOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 mt-1">
                            <LogOutIcon className="w-5 h-5 mr-3"/> Log Out
                        </button>
                    </div>
                 )}
            </div>
        );
    }

    return (
        <div ref={menuRef} className="relative w-full p-2">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center w-full group p-2 rounded-lg hover:bg-gray-100">
                <UserAvatar name={userName} className="w-9 h-9 text-sm flex-shrink-0" />
                <div className="ml-3 text-left min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-800 truncate">{userName}</p>
                    <p className="text-xs text-gray-500">Admin</p>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 ml-2 flex-shrink-0 group-hover:text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </button>
            {isOpen && (
                 <div className="absolute bottom-full left-2 right-2 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-1 z-[60]">
                    <button onClick={() => { onLogout(); setIsOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50">
                        <LogOutIcon className="w-5 h-5 mr-3"/> Log Out
                    </button>
                </div>
            )}
        </div>
    );
};

const NavSection: React.FC<{ title: string; isSidebarOpen: boolean; children: React.ReactNode }> = ({ title, isSidebarOpen, children }) => (
    <div className="mt-4 pt-4 border-t border-slate-200/80">
        {isSidebarOpen && <h3 className="px-4 mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>}
        <ul className="space-y-1">
            {children}
        </ul>
    </div>
);


export const Sidebar: React.FC<SidebarProps> = ({
    activeView,
    setActiveView,
    isSidebarOpen,
    setIsSidebarOpen,
    onLogout,
}) => {

    const companySubItems = [
        { label: 'Company Profile', view: 'company-profile' as View, icon: CompanyIcon },
        { label: 'Employees', view: 'employees' as View, icon: UsersIcon },
    ];

    return (
        <aside className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-200 z-30 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="flex flex-col h-full relative">
                 <div className="flex-shrink-0 h-16 border-b border-slate-200 flex items-center relative">
                    <button onClick={() => setActiveView('dashboard')} className={`flex items-center h-full ${isSidebarOpen ? 'px-4' : 'justify-center w-full'}`} title="Dashboard">
                       <ShipNowIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
                       {isSidebarOpen && <span className="ml-3 font-bold text-gray-800">SHIPNOW</span>}
                    </button>
                    {!isSidebarOpen && (
                        <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] shadow-lg">
                            SHIPNOW - Dashboard
                        </div>
                    )}
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors ${isSidebarOpen ? 'ml-auto mr-2' : 'absolute bottom-4 left-1/2 -translate-x-1/2'}`}
                        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        <ChevronDoubleLeftIcon className={`w-5 h-5 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
                    </button>
                </div>


                <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden sidebar-nav-scroll min-h-0">
                    <NavSection title="Análisis" isSidebarOpen={isSidebarOpen}>
                         <NavItem 
                            icon={DashboardIcon} 
                            label="Dashboard" 
                            isActive={activeView === 'dashboard'} 
                            onClick={() => setActiveView('dashboard')} 
                            isSidebarOpen={isSidebarOpen} 
                        />
                    </NavSection>

                     <NavSection title="Gestión" isSidebarOpen={isSidebarOpen}>
                        <NavItem 
                            icon={TruckIcon} 
                            label="Operations" 
                            isActive={activeView === 'operations' || activeView === 'create-operation' || activeView === 'detail-operation'} 
                            onClick={() => setActiveView('operations')} 
                            isSidebarOpen={isSidebarOpen} 
                        />
                    </NavSection>

                    <NavSection title="Finanzas" isSidebarOpen={isSidebarOpen}>
                        <NavItem 
                            icon={CurrencyDollarOutlineIcon} 
                            label="Finance" 
                            isActive={['finance-hub', 'quotations', 'all_invoices', 'all_payments', 'all_expenses', 'bank_accounts', 'bank-reconciliation', 'finance'].includes(activeView)} 
                            onClick={() => setActiveView('finance-hub')} 
                            isSidebarOpen={isSidebarOpen} 
                        />
                    </NavSection>

                    <NavSection title="Herramientas" isSidebarOpen={isSidebarOpen}>
                        <NavItem icon={CalendarIcon} label="Calendar" isActive={activeView === 'calendar'} onClick={() => setActiveView('calendar')} isSidebarOpen={isSidebarOpen} />
                        <NavItem icon={FolderOpenIcon} label="Gestor de Archivos" isActive={activeView === 'files'} onClick={() => setActiveView('files')} isSidebarOpen={isSidebarOpen} />
                        <NavItem 
                            icon={MailIcon} 
                            label="Email & Calendario" 
                            isActive={['email-hub', 'integrations', 'email-analysis', 'operation-linking-rules', 'task-automation'].includes(activeView)} 
                            onClick={() => setActiveView('email-hub')} 
                            isSidebarOpen={isSidebarOpen} 
                        />
                    </NavSection>

                    <NavSection title="Administración" isSidebarOpen={isSidebarOpen}>
                        <NavItem 
                            icon={CompanyIcon} 
                            label="Empresa" 
                            isActive={['company-hub', 'company-profile', 'employees', 'clients', 'create-client', 'client-detail', 'knowledge-base', 'virtual-assistant'].includes(activeView)} 
                            onClick={() => setActiveView('company-hub')} 
                            isSidebarOpen={isSidebarOpen} 
                        />
                        <NavItem 
                            icon={BellIcon} 
                            label="Notificaciones" 
                            isActive={activeView === 'notifications-settings'} 
                            onClick={() => setActiveView('notifications-settings')} 
                            isSidebarOpen={isSidebarOpen} 
                        />
                    </NavSection>
                </nav>

                <div className="mt-auto border-t border-slate-200 flex-shrink-0">
                     <UserMenu onLogout={onLogout} isSidebarOpen={isSidebarOpen} />
                </div>
            </div>
            <style>{`
                .sidebar-nav-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: #e2e8f0 transparent;
                }
                .sidebar-nav-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .sidebar-nav-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .sidebar-nav-scroll::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 20px;
                }
                .sidebar-nav-scroll:hover::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                }
            `}</style>
        </aside>
    );
};