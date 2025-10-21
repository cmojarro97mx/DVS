import React from 'react';
import { Card } from './Card';

const TruckStatus = ({ color, title, value }: { color: string, title: string, value: number }) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center">
      <div className={`w-2 h-5 rounded-full ${color} mr-3`}></div>
      <span className="text-sm text-gray-600">{title}</span>
    </div>
    <span className="text-sm font-bold text-gray-800">{value}</span>
  </div>
);

export const LoadingTrucksCard = () => {
  return (
    <Card title="Loading Trucks" viewAll>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        <div className="relative flex justify-center items-center">
           <svg width="150" height="150" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E7EB" strokeWidth="15" />
               <circle cx="60" cy="60" r="50" fill="none" stroke="#f87171" strokeWidth="15" strokeDasharray="157" strokeDashoffset="0" />
               <circle cx="60" cy="60" r="50" fill="none" stroke="#fb923c" strokeWidth="15" strokeDasharray="314" strokeDashoffset="-157" />
            </svg>
            <div className="absolute text-center">
                <p className="text-3xl font-bold text-gray-800">0</p>
                <p className="text-sm text-gray-500">Total Trucks</p>
            </div>
        </div>
        <div className="space-y-2">
            <TruckStatus color="bg-red-500" title="Active" value={0} />
            <TruckStatus color="bg-red-300" title="Ready to Load" value={0} />
            <TruckStatus color="bg-gray-400" title="Ready to Un-load" value={0} />
            <TruckStatus color="bg-yellow-500" title="Loading Delayed" value={0} />
            <TruckStatus color="bg-yellow-300" title="Unloading Delayed" value={0} />
            <TruckStatus color="bg-gray-600" title="Canceled" value={0} />
        </div>
      </div>
    </Card>
  );
};
