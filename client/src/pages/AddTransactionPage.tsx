import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Category, Transaction, TxType } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

const EXPENSE_FALLBACK = [
  'Food',
  'Transport',
  'University',
  'Home',
  'Internet & Phone',
  'Shopping',
  'Other',
];

export function AddTransactionPage() {
  const { transactions, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');
  const editing = useMemo(
    () => transactions.find((t) => t.id === editId),
    [transactions, editId]
  );

  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ categories: Category[] }>('/api/settings')
      .then((d) => setCategories(d.categories))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!editing) return;
    setType(editing.type);
    setAmount(String(editing.amount));
    setReceivedFrom(editing.received_from || '');
    setCategory(editing.category);
    setDescription(editing.description);
    setNote(editing.note || '');
    setDate(editing.date);
    setTime(editing.time);
  }, [editing]);

  const categoryOptions =
    type === 'expense'
      ? categories.filter((c) => c.type === 'expense').map((c) => c.name)
      : categories.filter((c) => c.type === 'received').map((c) => c.name);

  const options =
    categoryOptions.length > 0
      ? categoryOptions
      : type === 'expense'
        ? EXPENSE_FALLBACK
        : ['Family Support', 'Gift', 'Other Received'];

  useEffect(() => {
    if (!options.includes(category)) {
      setCategory(options[0] || '');
    }
  }, [type, options, category]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        type,
        amount: Number(amount),
        category,
        description:
          type === 'expense'
            ? description
            : description || (receivedFrom ? `Money from ${receivedFrom}` : ''),
        receivedFrom: type === 'received' ? receivedFrom : undefined,
        note,
        date,
        time,
      };

      if (editing) {
        await api<{ transaction: Transaction }>(`/api/transactions/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('Transaction updated', 'success');
      } else {
        await api('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast('Transaction saved', 'success');
      }
      await refresh();
      navigate('/');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          {editing ? 'Edit Transaction' : 'Add Transaction'}
        </h1>
        <p className="text-sm text-muted mt-1">
          Record money received or spent in a few seconds.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setType('received')}
          className={`rounded-2xl border p-4 text-left transition min-h-[88px] ${
            type === 'received'
              ? 'border-success bg-success/5 ring-2 ring-success/20'
              : 'border-border bg-surface'
          }`}
        >
          <p className="font-display font-semibold text-ink">Money Received</p>
          <p className="text-xs text-muted mt-1">From family or gifts</p>
        </button>
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`rounded-2xl border p-4 text-left transition min-h-[88px] ${
            type === 'expense'
              ? 'border-expense bg-expense/5 ring-2 ring-expense/20'
              : 'border-border bg-surface'
          }`}
        >
          <p className="font-display font-semibold text-ink">Money Spent</p>
          <p className="text-xs text-muted mt-1">Daily expenses</p>
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <Field label="Amount">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-medium">
              $
            </span>
            <Input
              className="pl-8 text-lg font-display font-semibold tabular"
              type="number"
              step="1"
              min="1"
              inputMode="numeric"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </Field>

        {type === 'received' ? (
          <Field label="Received From">
            <Input
              required
              value={receivedFrom}
              onChange={(e) => setReceivedFrom(e.target.value)}
              placeholder="Father"
            />
          </Field>
        ) : (
          <Field label="Description">
            <Input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Taxi to University"
            />
          </Field>
        )}

        <Field label="Category">
          <Select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {options.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <Input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Time">
            <Input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Note">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
          />
        </Field>

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Update Transaction' : 'Save Transaction'}
        </Button>
      </form>
    </div>
  );
}
