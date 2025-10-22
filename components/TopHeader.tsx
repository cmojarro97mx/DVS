import React from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { BellIcon } from './icons/BellIcon';

interface TopHeaderProps {
    onLogout: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onLogout }) => {
    
    return (
        <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 sticky top-0 z-20">
            <div className="h-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-full gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="relative w-full max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center flex-shrink-0">
                        <button className="p-2 sm:p-2.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 transition-colors">
                            <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
