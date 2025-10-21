import React, { useMemo } from 'react';
import { Project } from '../../pages/DashboardPage';

interface ShipmentStatusChartProps {
  projects: Project[];
}

const statusConfig: { [key: string]: { color: string, label: string } } = {
  'In Transit': { color: '#3b82f6', label: 'In Transit' },
  'Delivered': { color: '#22c55e', label: 'Delivered' },
  'On Hold': { color: '#f59e0b', label: 'On Hold' },
  'Planning': { color: '#6b7280', label: 'Planning' },
  'Customs Clearance': { color: '#8b5cf6', label: 'Customs' },
  'Canceled': { color: '#ef4444', label: 'Canceled' },
};

export const ShipmentStatusChart: React.FC<ShipmentStatusChartProps> = ({ projects }) => {
  const statusCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    for (const project of projects) {
      counts[project.status] = (counts[project.status] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  const totalProjects = projects.length;
  if (totalProjects === 0) return null;

  const circumference = 2 * Math.PI * 45;
  let offset = 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Shipment Status Breakdown</h3>
      <div className="flex items-center gap-8">
        <div className="relative w-40 h-40 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {statusCounts.map(({ status, count }) => {
              const percentage = (count / totalProjects) * 100;
              const dash = (percentage / 100) * circumference;
              const color = statusConfig[status]?.color || '#a1a1aa';
              const strokeDashoffset = offset;
              offset -= dash;

              return (
                <circle
                  key={status}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="10"
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">{totalProjects}</span>
            <span className="text-xs text-gray-500">Total</span>
          </div>
        </div>
        <div className="flex-grow space-y-2">
          {statusCounts.map(({ status, count }) => {
            const config = statusConfig[status] || { color: '#a1a1aa', label: status };
            return (
              <div key={status} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="font-medium text-gray-700">{config.label}</span>
                </div>
                <span className="font-bold text-gray-800">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};