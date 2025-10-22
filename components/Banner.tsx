import React from 'react';

interface BannerProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
}

const Banner: React.FC<BannerProps> = ({ title, description, icon: Icon, actions }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    {Icon && (
                        <div className="p-2 md:p-3 bg-red-50 rounded-lg flex-shrink-0">
                            <Icon className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{title}</h1>
                        {description && <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>}
                    </div>
                </div>
                {actions && <div className="flex gap-2 md:gap-3 flex-shrink-0 w-full sm:w-auto">{actions}</div>}
            </div>
        </div>
    );
};

export { Banner };