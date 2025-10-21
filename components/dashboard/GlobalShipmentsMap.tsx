import React from 'react';
import { Project } from '../../pages/DashboardPage';
import { WorldMapIcon } from '../icons/WorldMapIcon';
import { MapPinIcon } from '../icons/MapPinIcon';

interface GlobalShipmentsMapProps {
  projects: Project[];
}

const cityCoordinates: { [key: string]: { x: number; y: number } } = {
  'Shanghai, China': { x: 838, y: 228 },
  'Long Beach, CA': { x: 235, y: 215 },
  'Monterrey, MX': { x: 295, y: 260 },
  'Puebla, MX': { x: 305, y: 290 },
};

export const GlobalShipmentsMap: React.FC<GlobalShipmentsMapProps> = ({ projects }) => {
  const activeShipments = projects.filter(p => p.status === 'In Transit');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex-shrink-0">Live Global Shipments</h3>
      <div className="flex-grow relative min-h-[300px]">
        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -1000;
            }
          }
          .animate-dash {
            animation: dash 60s linear infinite;
          }
          @keyframes pulse-dot {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.5);
              opacity: 0.7;
            }
          }
          .pulse-dot {
            animation: pulse-dot 2s ease-in-out infinite;
          }
        `}</style>
        <div className="absolute inset-0 flex items-center justify-center">
          <WorldMapIcon className="w-full h-full text-gray-100" />
        </div>
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 1024 541">
          {activeShipments.map(project => {
            const origin = cityCoordinates[project.pickupAddress];
            const destination = cityCoordinates[project.deliveryAddress];

            if (!origin || !destination) return null;

            const isSea = project.shippingMode === 'Sea Freight';
            const curve = isSea 
                ? `M ${origin.x},${origin.y} C ${origin.x-50},${origin.y-70} ${destination.x+50},${destination.y-70} ${destination.x},${destination.y}`
                : `M ${origin.x},${origin.y} L ${destination.x},${destination.y}`;

            return (
              <g key={project.id}>
                <title>{`${project.projectName} (${project.id})`}</title>
                <path
                  d={curve}
                  fill="none"
                  stroke="rgba(239, 68, 68, 0.4)"
                  strokeWidth="2"
                />
                <path
                  d={curve}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  className="animate-dash"
                />
                <circle cx={origin.x} cy={origin.y} r="6" fill="#1d4ed8" stroke="white" strokeWidth="2" />
                <circle cx={destination.x} cy={destination.y} r="6" fill="#1d4ed8" stroke="white" strokeWidth="2" className="pulse-dot" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};