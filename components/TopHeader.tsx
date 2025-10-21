import React from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { BellIcon } from './icons/BellIcon';

interface TopHeaderProps {
    onLogout: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onLogout }) => {
    
    return (
        <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 sticky top-0 z-20">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex justify-between items-center h-full gap-4">
                    <div className="flex-1 flex justify-start">
                        <div className="relative w-full max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search anything..."
                                className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-11 pr-4 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <button className="p-2.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 transition-colors">
                            <BellIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
