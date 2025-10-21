import React, { useState, useMemo } from 'react';
import { Client } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { Banner } from '../components/Banner';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { FilterIcon } from '../components/icons/FilterIcon';
import { BriefcaseIcon } from '../components/icons/BriefcaseIcon';
import { DiamondIcon } from '../components/icons/DiamondIcon';

interface ClientsManagerProps {
    clients: Client[];
    onViewClientDetails: (clientId: string) => void;
    onAddNewClient: () => void;
}

const colors = [
  'bg-red-200 text-red-800',
  'bg-yellow-200 text-yellow-800',
  'bg-green-200 text-green-800',
  'bg-blue-200 text-blue-800',
  'bg-indigo-200 text-indigo-800',
  'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800',
  'bg-orange-200 text-orange-800',
];

const getColorForString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

const ClientAvatar: React.FC<{ clientName: string }> = ({ clientName }) => {
  const initials = (clientName
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('') || clientName.substring(0, 2)
  ).toUpperCase();
  
  const colorClass = getColorForString(clientName);

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorClass}`}
      title={clientName}
    >
      {initials}
    </div>
  );
};

const getStatusColor = (status: 'Active' | 'Inactive') => {
    switch (status) {
        case 'Active': return 'bg-green-100 text-green-800';
        case 'Inactive': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getTierColor = (tier?: 'Gold' | 'Silver' | 'Bronze' | 'Standard') => {
    switch (tier) {
        case 'Gold': return 'bg-yellow-400/30 text-yellow-900 border-yellow-500/50';
        case 'Silver': return 'bg-gray-300/40 text-gray-800 border-gray-400/50';
        case 'Bronze': return 'bg-orange-300/40 text-orange-900 border-orange-400/50';
        case 'Standard': return 'bg-blue-100/70 text-blue-800 border-blue-200/80';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const statuses = ['All', 'Active', 'Inactive'];

const ClientsManager: React.FC<ClientsManagerProps> = ({ clients, onViewClientDetails, onAddNewClient }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesStatus = statusFilter === 'All' || client.status === statusFilter;
            
            const lowercasedQuery = searchQuery.toLowerCase().trim();
            if (lowercasedQuery === '') {
                return matchesStatus;
            }

            const matchesSearch = client.name.toLowerCase().includes(lowercasedQuery) ||
                                  client.contactPerson.toLowerCase().includes(lowercasedQuery) ||
                                  client.email.toLowerCase().includes(lowercasedQuery);
            
            return matchesStatus && matchesSearch;
        });
    }, [clients, searchQuery, statusFilter]);

    return (
        <div className="animate-fade-in space-y-6 h-full flex flex-col">
            <Banner
                title="Client Management"
                description="View, manage, and organize your customer database from a centralized dashboard."
                icon={UsersIcon}
            />

            <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name, contact, or email..." 
                            className="pl-10 pr-4 py-2 w-full md:w-64 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-red-500 focus:border-red-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-4 py-2 appearance-none border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-red-500 focus:border-red-500"
                        >
                            {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                        </select>
                    </div>
                </div>
                <button onClick={onAddNewClient} className="w-full md:w-auto flex items-center justify-center bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add New Client
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-grow min-h-0">
                {filteredClients.length > 0 ? (
                    <div className="overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr className="border-b border-slate-300">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Tier</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} onClick={() => onViewClientDetails(client.id)} className="hover:bg-slate-50 cursor-pointer group">
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center gap-4">
                                                <ClientAvatar clientName={client.name} />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm text-slate-800 truncate" title={client.name}>{client.name}</p>
                                                    <p className="text-xs text-slate-500">{client.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                                                {client.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md border ${getTierColor(client.tier)}`}>
                                                <DiamondIcon className="w-3 h-3" />
                                                {client.tier || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-slate-700">{client.contactPerson}</p>
                                                <p className="text-xs text-slate-500">{client.phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle text-right">
                                            <ChevronRightIcon className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-20 flex flex-col items-center justify-center flex-grow">
                        <div className="bg-slate-100 rounded-full p-5">
                            <UsersIcon className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="mt-6 text-lg font-semibold text-slate-800">No Clients Found</h3>
                        <p className="mt-1 text-sm text-slate-500 max-w-sm">
                            {searchQuery || statusFilter !== 'All' 
                                ? `No clients match your current filters. Try adjusting your search or filter.`
                                : `Get started by creating your first client.`
                            }
                        </p>
                        <button onClick={onAddNewClient} className="mt-6 flex items-center bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Create Your First Client
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientsManager;