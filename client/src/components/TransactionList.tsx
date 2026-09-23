import {
  ArrowDownLeft,
  ArrowUpRight,
  Bus,
  GraduationCap,
  Home,
  ShoppingBag,
  Utensils,
  Wifi,
  MoreHorizontal,
  Gift,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Transaction } from '../lib/types';
import { formatSigned } from '../lib/types';
import { format, parseISO, isToday } from 'date-fns';

function categoryIcon(category: string, type: string) {
  if (type === 'received') {
    if (category.includes('Family')) return Users;
    if (category.includes('Gift')) return Gift;
    return ArrowDownLeft;
  }
  const map: Record<string, typeof Utensils> = {
    Food: Utensils,
    Transport: Bus,
    University: GraduationCap,
    Home: Home,
    'Internet & Phone': Wifi,
    Shopping: ShoppingBag,
    Other: MoreHorizontal,
  };
  return map[category] || ArrowUpRight;
}

function formatWhen(date: string, time: string) {
  const d = parseISO(date);
  const timeLabel = format(parseISO(`${date}T${time}`), 'h:mm a');
  if (isToday(d)) return `Today, ${timeLabel}`;
  return `${format(d, 'MMM d')}, ${timeLabel}`;
}

export function TransactionCard({
  tx,
  currency = 'USD',
}: {
  tx: Transaction;
  currency?: string;
}) {
  const Icon = categoryIcon(tx.category, tx.type);
  const isReceived = tx.type === 'received';

  return (
    <Link
      to={`/transactions/${tx.id}`}
      className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition min-h-14"
    >
      <div
        className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
          isReceived ? 'bg-success/10 text-success' : 'bg-expense/10 text-expense'
        }`}
      >
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink truncate">
          {isReceived
            ? tx.received_from
              ? `From ${tx.received_from}`
              : tx.description || tx.category
            : tx.description || tx.category}
        </p>
        <p className="text-xs text-muted truncate">
          {tx.category} · {formatWhen(tx.date, tx.time)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={`font-semibold tabular text-sm ${
            isReceived ? 'text-success' : 'text-expense'
          }`}
        >
          {formatSigned(tx.amount, tx.type, currency)}
        </p>
        <p className="text-[11px] text-muted tabular">
          Bal: {formatSigned(tx.balance_after, 'received', currency).replace('+', '')}
        </p>
      </div>
    </Link>
  );
}

export function TransactionTable({
  transactions,
  currency = 'USD',
}: {
  transactions: Transaction[];
  currency?: string;
}) {
  return (
    <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold text-right">Amount</th>
            <th className="px-4 py-3 font-semibold text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-border last:border-0 hover:bg-canvas/80"
            >
              <td className="px-4 py-3.5">
                <Link to={`/transactions/${tx.id}`} className="block">
                  {format(parseISO(tx.date), 'MMM d')}
                </Link>
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    tx.type === 'received'
                      ? 'bg-success/10 text-success'
                      : 'bg-expense/10 text-expense'
                  }`}
                >
                  {tx.type === 'received' ? 'Received' : 'Expense'}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <Link to={`/transactions/${tx.id}`} className="hover:text-primary">
                  {tx.type === 'received'
                    ? tx.received_from
                      ? `Money from ${tx.received_from}`
                      : tx.description
                    : tx.description}
                </Link>
              </td>
              <td className="px-4 py-3.5 text-muted">{tx.category}</td>
              <td
                className={`px-4 py-3.5 text-right font-medium tabular ${
                  tx.type === 'received' ? 'text-success' : 'text-expense'
                }`}
              >
                {formatSigned(tx.amount, tx.type, currency)}
              </td>
              <td className="px-4 py-3.5 text-right tabular text-muted">
                {formatSigned(tx.balance_after, 'received', currency).replace('+', '')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
