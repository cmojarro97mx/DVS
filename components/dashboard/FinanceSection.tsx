import React from 'react';
import { ArrowUpRightIcon } from '../icons/ArrowUpRightIcon';

interface FinanceSectionProps {
    title: string;
    icon: React.ElementType;
    count: number;
    currencyTotals: { currency: string; total: number }[];
    onManageClick: () => void;
    children: React.ReactNode; // Chart component
}

const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
        USD: '$',
        MXN: '$',
        EUR: '€',
    };
    const symbol = symbols[currency] || '$';
    const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    return (
        <div className="flex items-baseline">
            <span className="text-base font-medium text-gray-500 mr-1">{symbol}</span>
            <span className="text-xl font-bold text-gray-800">{formattedAmount}</span>
            <span className="text-sm font-medium text-gray-500 ml-1.5">{currency}</span>
        </div>
    );
};

export const FinanceSection: React.FC<FinanceSectionProps> = ({ title, icon: Icon, count, currencyTotals, onManageClick, children }) => {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-1/3 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2.5 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                </div>
                <div className="flex-grow space-y-3">
                    <p className="text-sm text-gray-600">Total Count: <span className="font-semibold text-gray-800">{count}</span></p>
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Totals by Currency:</p>
                        {currencyTotals.length > 0 ? (
                            <div className="space-y-3">
                                {currencyTotals.slice(0, 3).map(({ currency, total }) => (
                                    <div key={currency}>
                                        {formatCurrency(total, currency)}
                                    </div>
                                ))}
                                {currencyTotals.length > 3 && (
                                    <p className="text-xs text-gray-500 mt-2">...and {currencyTotals.length - 3} more</p>
                                )}
                            </div>
                        ) : (
                             <div className="space-y-3">
                                <div>{formatCurrency(0, 'USD')}</div>
                                <div>{formatCurrency(0, 'MXN')}</div>
                                <div>{formatCurrency(0, 'EUR')}</div>
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={onManageClick}
                    className="mt-4 w-full flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                    Manage {title}
                    <ArrowUpRightIcon className="w-4 h-4 ml-1.5" />
                </button>
            </div>
            <div className="w-full sm:w-2/3">
                {children}
            </div>
        </div>
    );
};