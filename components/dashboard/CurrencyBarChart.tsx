import React from 'react';
import { ChartPieIcon } from '../icons/ChartPieIcon';

interface ChartDataItem {
    currency: string;
    total: number;
}

interface CurrencyBarChartProps {
    data: ChartDataItem[];
    height?: number;
}

const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export const CurrencyBarChart: React.FC<CurrencyBarChartProps> = ({ data, height = 150 }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200" style={{ height: `${height}px` }}>
                <ChartPieIcon className="w-10 h-10 text-gray-300 mb-2" />
                <p className="font-semibold text-gray-600">No Data Available</p>
                <p className="text-xs">Transactions will appear here once recorded.</p>
            </div>
        );
    }
    
    const sortedData = [...data].sort((a, b) => b.total - a.total);
    const maxValue = Math.max(...sortedData.map(d => d.total), 0);
    const gridLines = 4;
    const chartHeight = height;

    return (
        <div className="w-full" style={{ height: `${chartHeight}px` }}>
            <svg width="100%" height="100%" className="overflow-visible">
                <g className="grid-lines">
                    {Array.from({ length: gridLines + 1 }).map((_, i) => {
                        const y = (chartHeight / gridLines) * i;
                        const value = maxValue - (maxValue / gridLines) * i;
                        return (
                            <g key={i}>
                                <line x1="0" x2="100%" y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                                <text x="-5" y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                                    {value > 1000 ? `${(value/1000).toFixed(0)}k` : value.toFixed(0)}
                                </text>
                            </g>
                        );
                    })}
                </g>
                <g className="bars" transform={`translate(0, 0)`}>
                    {sortedData.map((item, index) => {
                        const barWidthPercent = 15;
                        const totalWidth = sortedData.length * barWidthPercent;
                        const spacingPercent = (100 - totalWidth) / (sortedData.length + 1);
                        const xPercent = (index * barWidthPercent) + ((index + 1) * spacingPercent);

                        const barHeight = maxValue > 0 ? (item.total / maxValue) * chartHeight : 0;
                        const y = chartHeight - barHeight;
                        const color = colors[index % colors.length];

                        return (
                            <g key={item.currency} className="group cursor-pointer">
                                <title>{`${item.currency}: ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</title>
                                <rect
                                    x={`${xPercent}%`}
                                    y={y}
                                    width={`${barWidthPercent}%`}
                                    height={barHeight}
                                    fill={color}
                                    className="transition-all duration-300 group-hover:opacity-80"
                                    rx="3"
                                />
                                <text x={`${xPercent + barWidthPercent / 2}%`} y={chartHeight + 15} textAnchor="middle" fontSize="11" fontWeight="500" fill="#4b5563">
                                    {item.currency}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};