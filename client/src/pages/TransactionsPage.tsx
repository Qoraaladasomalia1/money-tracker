import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TransactionCard, TransactionTable } from '../components/TransactionList';
import { EmptyState } from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/Input';
import { formatMoney } from '../lib/types';

export function TransactionsPage() {
  const { transactions, summary, user } = useAuth();
  const currency = user?.currency || 'USD';
  const [filter, setFilter] = useState<'all' | 'received' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const categories = useMemo(
    () => [...new Set(transactions.map((t) => t.category))].sort(),
    [transactions]
  );

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (category && t.category !== category) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${t.description} ${t.category} ${t.received_from || ''} ${t.note}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, filter, category, from, to, search]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Transactions</h1>
        <p className="text-sm text-muted mt-1">
          Current Balance:{' '}
          <span className="font-semibold text-ink tabular">
            {formatMoney(summary?.balance || 0, currency)}
          </span>
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'received', 'expense'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 h-9 px-4 rounded-full text-sm font-medium border transition ${
              filter === f
                ? 'bg-primary text-white border-primary'
                : 'bg-surface border-border text-muted'
            }`}
          >
            {f === 'all' ? 'All' : f === 'received' ? 'Received' : 'Expenses'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            className="pl-9"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={transactions.length ? 'No matching transactions' : undefined}
          description={
            transactions.length
              ? 'Try adjusting your filters or search.'
              : undefined
          }
          showAdd={!transactions.length}
        />
      ) : (
        <>
          <TransactionTable transactions={filtered} currency={currency} />
          <div className="md:hidden space-y-2">
            {filtered.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} currency={currency} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
