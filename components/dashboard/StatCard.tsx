import React from 'react';
import { ArrowUpIcon } from '../icons/ArrowUpIcon';
import { ArrowDownIcon } from '../icons/ArrowDownIcon';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change: string;
  changeType: 'increase' | 'decrease';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, change, changeType }) => {
  const isIncrease = changeType === 'increase';
  const changeColor = isIncrease ? 'text-green-700' : 'text-red-700';
  const ChangeIcon = isIncrease ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-5">
      <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0">
        <Icon className="w-6 h-6 text-slate-600" />
      </div>
      <div className="flex-grow">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <div className={`flex items-center text-xs font-bold ${changeColor}`}>
                <ChangeIcon className="w-3 h-3 mr-0.5" />
                {change}
            </div>
        </div>
      </div>
    </div>
  );
};