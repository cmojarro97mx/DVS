import React from 'react';
import { SearchIcon } from '../icons/SearchIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { LogoIcon } from '../icons/LogoIcon';


const OrderRequestItem = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
            <div className="flex items-center">
                <span className="font-bold text-gray-800">ORDERID01</span>
            </div>
            <span className="text-xs text-gray-500">17 July 2024 18:00</span>
        </div>
        <div className="flex">
            <div className="flex-1 space-y-2 text-sm">
                <div className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-blue-500 mt-1 mr-2 border-4 border-white box-content"></div>
                    <div>
                        <p className="text-gray-500">Pickup Location</p>
                        <p className="text-gray-800 font-medium">41 Sector 15, Scf, Delhi</p>
                    </div>
                </div>
                 <div className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-green-500 mt-1 mr-2"></div>
                    <div>
                        <p className="text-gray-500">Destination</p>
                        <p className="text-gray-800 font-medium">C6, Shah Colony, Mumbai</p>
                    </div>
                </div>
            </div>
            <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                 <p className="text-xs text-gray-500">Map</p>
            </div>
        </div>
        <div className="flex justify-between items-center border-t border-red-200 pt-3 mt-3">
             <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center mr-2">
                    <span className="font-bold text-green-800">RI</span>
                </div>
                <span className="text-sm font-medium text-gray-800">Raj Industries</span>
            </div>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800">View Details</a>
        </div>
    </div>
);

export const OrderRequestsCard = () => {
    return (
        <div className="bg-white rounded-lg h-full flex flex-col">
            <div className="p-6 border-b">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Order Requests</h3>
                     <div className="flex items-center space-x-2 text-gray-500">
                        <button className="p-1 hover:bg-gray-100 rounded-full"><CalendarIcon className="w-5 h-5"/></button>
                        <button className="p-1 hover:bg-gray-100 rounded-full"><ClockIcon className="w-5 h-5"/></button>
                     </div>
                 </div>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="text" placeholder="Search by order id, Date etc" className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500" />
                 </div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <h4 className="text-sm font-medium text-gray-500">Recent Order Requests</h4>
                <div className="text-center py-12 text-gray-500">
                    <p>No order requests at the moment.</p>
                </div>
            </div>
        </div>
    );
};