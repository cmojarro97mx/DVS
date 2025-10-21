import React, { useMemo } from 'react';
import { Expense } from '../../pages/DashboardPage';
import { ChartBarIcon } from '../icons/ChartBarIcon';

interface ExpenseChartProps {
    expenses: Expense[];
}

const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses }) => {
    const chartData = useMemo(() => {
        if (!expenses || expenses.length === 0) return [];
        
        // Explicitly cast the initial value of the reduce accumulator to `Record<string, number>`
        // to ensure TypeScript infers the correct type for `total`, resolving the arithmetic error.
        const totalsByCurrency = expenses.reduce((acc, expense) => {
            const currentTotal = acc[expense.currency] || 0;
            const priceAsNumber = Number(expense.price) || 0;
            (acc as any)[expense.currency] = currentTotal + priceAsNumber;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(totalsByCurrency)
            // FIX: Explicitly cast `total` to `number` to prevent type errors in the sort function.
            .map(([currency, total]) => ({ currency, total: total as number }))
            .sort((a, b) => b.total - a.total);

    }, [expenses]);

    if (chartData.length === 0) {
        return null;
    }

    const maxValue = Math.max(...chartData.map(d => d.total), 0);
    const gridLines = 5;
    const chartHeight = 200;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center mb-4">
                <ChartBarIcon className="w-6 h-6 text-gray-500 mr-3" />
                <h3 className="text-lg font-bold text-gray-800">Expense Summary by Currency</h3>
            </div>
            <div className="w-full" style={{ height: `${chartHeight}px` }}>
                <svg width="100%" height="100%" className="overflow-visible">
                    <g className="grid-lines">
                        {Array.from({ length: gridLines + 1 }).map((_, i) => {
                            const y = (chartHeight / gridLines) * i;
                            const value = maxValue - (maxValue / gridLines) * i;
                            return (
                                <g key={i}>
                                    <line x1="0" x2="100%" y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                                    <text x="-10" y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                                        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                    <g className="bars" transform={`translate(0, 0)`}>
                        {chartData.map((item, index) => {
                            const barWidth = 35;
                            const barWidthPercent = (barWidth * 100) / 400;
                            const spacingPercent = (100 - (chartData.length * barWidthPercent)) / (chartData.length + 1);
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
                                        rx="4"
                                    />
                                    <text x={`${xPercent + barWidthPercent / 2}%`} y={chartHeight + 15} textAnchor="middle" fontSize="12" fontWeight="500" fill="#4b5563">
                                        {item.currency}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>
        </div>
    );
};
