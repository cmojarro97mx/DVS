import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { GridIcon } from './icons/GridIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { TasksIcon } from './icons/TasksIcon';
import { UsersIcon } from './icons/UsersIcon';
import { BuildingStorefrontIcon } from './icons/BuildingStorefrontIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { AtSymbolIcon } from './icons/AtSymbolIcon';
import { ChatBubbleQuestionIcon } from './icons/ChatBubbleQuestionIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

const LifebuoyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
    <circle cx="12" cy="12" r="4" strokeWidth={1.5}/>
    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" strokeWidth={1.5} />
    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" strokeWidth={1.5} />
    <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" strokeWidth={1.5} />
    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" strokeWidth={1.5} />
  </svg>
);


type HelpTopicId = 'dashboard' | 'operations' | 'tasks' | 'clients' | 'suppliers' | 'finance' | 'email';

interface HelpTopic {
  id: HelpTopicId;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const helpCategories: { name: string; topics: HelpTopic[] }[] = [
    {
        name: 'Getting Started',
        topics: [
            { id: 'dashboard', title: 'Dashboard', icon: GridIcon, content: "The Dashboard provides a high-level overview of your logistics operations, displaying key performance indicators (KPIs), recent orders, and the latest shipping activities." },
            { id: 'operations', title: 'Operations', icon: ClipboardListIcon, content: "The Operations module is where you manage all your logistics projects. Create new operations, track their status, assign team members, and view detailed information for each shipment." },
        ]
    },
    {
        name: 'Core Features',
        topics: [
            { id: 'tasks', title: 'Tasks', icon: TasksIcon, content: "The All Tasks view gives you a consolidated list of every task across all your operations. This helps you and your team stay organized and monitor deadlines." },
            { id: 'clients', title: 'Clients', icon: UsersIcon, content: "Manage your entire customer database in the Clients section. Add new clients, edit their contact information, and view their operational history." },
            { id: 'suppliers', title: 'Suppliers', icon: BuildingStorefrontIcon, content: "The Suppliers module allows you to manage your network of vendors and partners. Store contact details, track the services they offer, and maintain internal ratings." },
        ]
    },
    {
        name: 'Tools',
        topics: [
            { id: 'finance', title: 'Finance', icon: CurrencyDollarIcon, content: "Get a complete financial overview of your business. This module provides a centralized dashboard for all invoices, payments, and expenses for every operation." },
            { id: 'email', title: 'Email Client', icon: AtSymbolIcon, content: "Connect your email accounts (like Gmail or Outlook) to manage all your business communications without leaving the platform." }
        ]
    }
];

const AccordionItem: React.FC<{
    topic: HelpTopic;
    isOpen: boolean;
    onClick: () => void;
}> = ({ topic, isOpen, onClick }) => {
    return (
        <div className="border-b border-gray-200/80 last:border-b-0">
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-100 transition-colors"
                aria-expanded={isOpen}
            >
                <div className="flex items-center">
                    <topic.icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-800 ml-3 text-sm">{topic.title}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-4 pt-0 text-sm text-gray-600">
                        {topic.content}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const HelpWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState<HelpTopicId | null>(null);

    const handleToggleAccordion = (id: HelpTopicId) => {
        setActiveAccordion(prev => (prev === id ? null : id));
    };

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => setActiveAccordion(null), 300);
    }

    return (
        <div className={`fixed bottom-5 right-5 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <div className={`
                w-80 max-h-[32rem] bg-white rounded-xl shadow-2xl border border-gray-200/80 flex flex-col
                transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right
                ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
            `}>
                <header className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <LifebuoyIcon className="w-6 h-6 text-blue-600" />
                        <h3 className="font-bold text-gray-800">Help Center</h3>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-200">
                        <XIcon className="w-5 h-5 text-gray-700" />
                    </button>
                </header>
                
                <div className="flex-grow overflow-y-auto">
                    {helpCategories.map(category => (
                        <div key={category.name} className="py-2">
                             <h4 className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">{category.name}</h4>
                             <div className="mt-1 bg-gray-50/50 rounded-md border border-gray-200/70">
                                {category.topics.map(topic => (
                                    <AccordionItem
                                        key={topic.id}
                                        topic={topic}
                                        isOpen={activeAccordion === topic.id}
                                        onClick={() => handleToggleAccordion(topic.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    pointer-events-auto
                    absolute bottom-0 right-0 w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center
                    text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300
                    transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 hover:scale-110'}
                `}
                aria-label="Open Help Center"
            >
                <ChatBubbleQuestionIcon className="w-7 h-7" />
            </button>
        </div>
    );
};
