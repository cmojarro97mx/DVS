import React, { useMemo } from 'react';
import { Invoice, Payment, Expense, View } from './DashboardPage';
import { InvoicesIcon } from '../components/icons/InvoicesIcon';
import { PaymentsIcon } from '../components/icons/PaymentsIcon';
import { ExpensesIcon } from '../components/icons/ExpensesIcon';
import { FinanceSection } from '../components/dashboard/FinanceSection';
import { CurrencyBarChart } from '../components/dashboard/CurrencyBarChart';
import { Banner } from '../components/Banner';
import { ChartPieIcon } from '../components/icons/ChartPieIcon';

interface FinanceDashboardPageProps {
  setActiveView: (view: View) => void;
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
}

const aggregateByCurrency = (items: any[], amountField: string) => {
    if (!items || items.length === 0) return [];

    // Explicitly cast the initial value of the reduce accumulator to `Record<string, number>`
    // to ensure TypeScript infers the correct type for `total`, resolving the arithmetic error.
    const totalsByCurrency = items.reduce((acc, item) => {
        const currency = item.currency || 'USD';
        const currentTotal = acc[currency] || 0;
        const amount = Number(item[amountField]) || 0;
        acc[currency] = currentTotal + amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(totalsByCurrency)
        .map(([currency, total]) => ({ currency, total: total as number }))
        .sort((a, b) => b.total - a.total);
};

const FinanceDashboardPage: React.FC<FinanceDashboardPageProps> = ({ setActiveView, invoices, payments, expenses }) => {
    const invoiceTotals = useMemo(() => aggregateByCurrency(invoices, 'total'), [invoices]);
    const paymentTotals = useMemo(() => aggregateByCurrency(payments, 'amount'), [payments]);
    const expenseTotals = useMemo(() => aggregateByCurrency(expenses, 'price'), [expenses]);

    return (
        <div className="animate-fade-in space-y-6">
            <Banner
                title="Financial Overview"
                description="A global view of your company's financial transactions by currency."
                icon={ChartPieIcon}
            />
            <div className="space-y-6">
                <FinanceSection
                    title="Invoices"
                    icon={InvoicesIcon}
                    count={invoices.length}
                    currencyTotals={invoiceTotals}
                    onManageClick={() => setActiveView('all_invoices')}
                >
                    <CurrencyBarChart data={invoiceTotals} />
                </FinanceSection>
                
                <FinanceSection
                    title="Payments"
                    icon={PaymentsIcon}
                    count={payments.length}
                    currencyTotals={paymentTotals}
                    onManageClick={() => setActiveView('all_payments')}
                >
                    <CurrencyBarChart data={paymentTotals} />
                </FinanceSection>

                <FinanceSection
                    title="Expenses"
                    icon={ExpensesIcon}
                    count={expenses.length}
                    currencyTotals={expenseTotals}
                    onManageClick={() => setActiveView('all_expenses')}
                >
                    <CurrencyBarChart data={expenseTotals} />
                </FinanceSection>
            </div>
        </div>
    );
};

export default FinanceDashboardPage;
