import React from 'react';
import { TruckIcon } from './icons/TruckIcon';
import { ShipIcon } from './icons/ShipIcon';
import { PackageIcon } from './icons/PackageIcon';
import { WarehouseIcon } from './icons/WarehouseIcon';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthVisuals = () => (
    <div className="w-full h-full bg-slate-900 text-white flex flex-col justify-center items-center p-12">
        <h2 className="text-4xl font-bold tracking-tight text-center">
            Streamline Your Supply Chain
        </h2>
        <p className="mt-4 text-lg text-slate-400 text-center max-w-md">
            The all-in-one platform to manage operations, clients, and finances with powerful AI-driven insights.
        </p>
        <div className="relative mt-16 w-full max-w-sm flex items-center justify-center aspect-square">
             <div className="absolute inset-0 border-2 border-dashed border-slate-700 rounded-full animate-spin-slow"></div>
             <div className="absolute inset-8 border border-slate-800 rounded-full"></div>
             
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 p-3 rounded-full shadow-lg">
                <TruckIcon className="w-8 h-8 text-red-400" />
             </div>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-slate-800 p-3 rounded-full shadow-lg">
                <WarehouseIcon className="w-8 h-8 text-red-400" />
             </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-slate-800 p-3 rounded-full shadow-lg">
                <ShipIcon className="w-8 h-8 text-red-400" />
             </div>
             <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-slate-800 p-3 rounded-full shadow-lg">
                <PackageIcon className="w-8 h-8 text-red-400" />
             </div>
             <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-full aspect-square w-24 h-24">
             </div>
        </div>
    </div>
);

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex overflow-hidden">
      <div className="hidden md:block md:w-1/2 lg:w-3/5">
        <AuthVisuals />
      </div>
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 overflow-y-auto">
        <div className="max-w-sm w-full">
            {children}
        </div>
      </div>
       <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 20s linear infinite;
          }
        `}</style>
    </div>
  );
};

export default AuthLayout;