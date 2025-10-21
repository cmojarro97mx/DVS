import React from 'react';

interface CardProps {
  title: string;
  viewAll?: boolean;
  children: React.ReactNode;
  className?: string;
  headerContent?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, viewAll = false, children, className = '', headerContent }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {viewAll && (
          <a href="#" className="text-sm font-medium text-red-600 hover:text-red-800">
            View All
          </a>
        )}
        {headerContent}
      </div>
      <div>{children}</div>
    </div>
  );
};
