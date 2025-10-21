import React from 'react';
import { Card } from './Card';
import { FileTextIcon } from '../icons/FileTextIcon';

const OrderStat = ({ icon: Icon, title, value, color }: { icon: React.ElementType; title: string; value: string; color: string; }) => (
    <div className="flex items-center">
        <div className={`p-2 rounded-full ${color}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="ml-3">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


export const RecentOrdersCard = () => {
  return (
    <Card title="Recent Orders" headerContent={
        <select className="bg-white text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500">
            <option>July</option>
            <option>June</option>
            <option>May</option>
        </select>
    }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
                <OrderStat icon={FileTextIcon} title="Active Orders" value="0" color="bg-red-500" />
                <OrderStat icon={FileTextIcon} title="Pending Req" value="0" color="bg-yellow-500" />
                <OrderStat icon={FileTextIcon} title="Accepted" value="0" color="bg-green-500" />
                <div className="mt-4">
                    <p className="text-xs text-gray-500">In comparison to last month</p>
                    <p className="text-lg font-bold text-gray-600 flex items-center">
                        0%
                    </p>
                </div>
            </div>
            <div className="flex items-end">
                 <svg width="100%" height="150" viewBox="0 0 200 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="lineChartGradientRed" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <polyline fill="url(#lineChartGradientRed)" stroke="#EF4444" strokeWidth="2" points="5,80 25,60 45,70 65,50 85,60 105,40 125,50 145,30 165,40 185,20" />
                    <line x1="5" y1="95" x2="195" y2="95" stroke="#E5E7EB" strokeWidth="1" />
                 </svg>
            </div>
        </div>
    </Card>
  );
};
