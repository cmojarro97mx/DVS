import React from 'react';

interface BannerProps {
  title: string;
  description: string;
  icon?: React.ElementType;
}

export const Banner: React.FC<BannerProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="flex items-start gap-4">
      {Icon && (
        <div className="flex-shrink-0 bg-slate-100 p-3 rounded-lg border border-slate-200">
           <Icon className="w-6 h-6 text-slate-600" />
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">{description}</p>
      </div>
    </div>
  );
};
