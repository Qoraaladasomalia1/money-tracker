import { ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SummaryCard } from '../components/SummaryCard';
import { MoneyOverviewChart } from '../components/MoneyOverviewChart';
import { TransactionCard } from '../components/TransactionList';
import { EmptyState } from '../components/ui/EmptyState';
import { formatMoney, formatSigned } from '../lib/types';
import { format } from 'date-fns';

export function DashboardPage() {
  const { summary, transactions, user } = useAuth();
  const currency = user?.currency || 'USD';
  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink mt-1">
            Dashboard
          </h1>
        </div>
        <Link
          to="/add"
          className="hidden sm:inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Add
        </Link>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5 md:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
          Current Balance
        </p>
        <p className="font-display text-4xl md:text-5xl font-bold tabular text-ink mt-1">
          {formatMoney(summary?.balance || 0, currency)}
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <SummaryCard
          label="Total Received"
          value={formatSigned(summary?.totalReceived || 0, 'received', currency)}
          tone="success"
          icon={<ArrowDownLeft size={18} />}
        />
        <SummaryCard
          label="Total Spent"
          value={formatSigned(summary?.totalSpent || 0, 'expense', currency)}
          tone="expense"
          icon={<ArrowUpRight size={18} />}
        />
        <SummaryCard
          label="Today's Spending"
          value={formatSigned(summary?.todaySpending || 0, 'expense', currency)}
          tone="expense"
          icon={<Calendar size={18} />}
        />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
        <h2 className="font-display text-lg font-semibold mb-1">Money Overview</h2>
        <p className="text-sm text-muted mb-4">Received · Expenses · Remaining</p>
        <MoneyOverviewChart />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold">Recent Transactions</h2>
        </div>
        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {recent.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} currency={currency} />
            ))}
            <Link
              to="/transactions"
              className="block text-center text-sm font-medium text-primary py-3"
            >
              View All Transactions →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
