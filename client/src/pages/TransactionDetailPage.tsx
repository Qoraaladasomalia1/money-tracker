import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatSigned, formatMoney } from '../lib/types';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export function TransactionDetailPage() {
  const { id } = useParams();
  const { transactions, user, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const currency = user?.currency || 'USD';

  const tx = transactions.find((t) => t.id === id);

  if (!tx) {
    return (
      <div className="space-y-4">
        <Link to="/transactions" className="inline-flex items-center gap-2 text-sm text-muted">
          <ArrowLeft size={16} /> Back
        </Link>
        <p>Transaction not found.</p>
      </div>
    );
  }

  const onDelete = async () => {
    try {
      await api(`/api/transactions/${tx.id}`, { method: 'DELETE' });
      await refresh();
      toast('Transaction deleted', 'success');
      navigate('/transactions');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const rows = [
    { label: 'Type', value: tx.type === 'received' ? 'Money Received' : 'Money Spent' },
    {
      label: 'Amount',
      value: formatSigned(tx.amount, tx.type, currency),
      className: tx.type === 'received' ? 'text-success' : 'text-expense',
    },
    { label: 'Category', value: tx.category },
    ...(tx.type === 'received' && tx.received_from
      ? [{ label: 'Received From', value: tx.received_from }]
      : []),
    { label: 'Description', value: tx.description || '—' },
    {
      label: 'Date',
      value: format(parseISO(tx.date), 'MMMM d, yyyy'),
    },
    {
      label: 'Time',
      value: format(parseISO(`${tx.date}T${tx.time}`), 'h:mm a'),
    },
    {
      label: 'Balance After Transaction',
      value: formatMoney(tx.balance_after, currency),
    },
    ...(tx.note ? [{ label: 'Note', value: tx.note }] : []),
  ];

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        to="/transactions"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to Transactions
      </Link>

      <h1 className="font-display text-2xl font-bold">Transaction Details</h1>

      <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 px-5 py-4">
            <span className="text-sm text-muted">{row.label}</span>
            <span className={`text-sm font-medium text-right tabular ${row.className || ''}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link to={`/add?edit=${tx.id}`} className="flex-1">
          <Button variant="secondary" fullWidth>
            <Pencil size={16} /> Edit
          </Button>
        </Link>
        <Button variant="danger" fullWidth onClick={() => setConfirmOpen(true)}>
          <Trash2 size={16} /> Delete
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onDelete}
        title="Delete transaction?"
        message="This will permanently remove this transaction and update your balance."
      />
    </div>
  );
}
