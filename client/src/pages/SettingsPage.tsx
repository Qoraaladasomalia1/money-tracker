import { useEffect, useState, type FormEvent } from 'react';
import { Download, Upload, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Category, User } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export function SettingsPage() {
  const { user, setUser, logout, refresh } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [theme, setTheme] = useState(user?.theme || 'light');
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState('');
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const load = async () => {
    const data = await api<{
      profile: { name: string; email: string; currency: string; theme: string };
      categories: Category[];
    }>('/api/settings');
    setName(data.profile.name);
    setEmail(data.profile.email);
    setCurrency(data.profile.currency);
    setTheme(data.profile.theme);
    setCategories(data.categories);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await api<{ profile: User }>('/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email, currency, theme }),
      });
      setUser({ ...user!, ...data.profile });
      document.documentElement.classList.toggle('dark', data.profile.theme === 'dark');
      toast('Settings saved', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      await api('/api/settings/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCat, type: 'expense' }),
      });
      setNewCat('');
      await load();
      toast('Category added', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await api(`/api/settings/categories/${id}`, { method: 'DELETE' });
      await load();
      toast('Category removed', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const exportData = async () => {
    try {
      const data = await api('/api/settings/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moneytrack-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Exported', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    }
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await api('/api/settings/import', {
        method: 'POST',
        body: JSON.stringify({ transactions: json.transactions || json }),
      });
      await refresh();
      toast('Imported successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import failed', 'error');
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      toast('Password updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const expenseCats = categories.filter((c) => c.type === 'expense');

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Keep your personal money notebook simple.
        </p>
      </header>

      <form
        onSubmit={saveProfile}
        className="rounded-2xl border border-border bg-surface p-5 space-y-4"
      >
        <h2 className="font-display font-semibold text-lg">Profile</h2>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button type="submit">Update Profile</Button>
      </form>

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="font-display font-semibold text-lg">Currency</h2>
        <Select
          value={currency}
          onChange={async (e) => {
            setCurrency(e.target.value);
            try {
              const data = await api<{ profile: User }>('/api/settings/profile', {
                method: 'PUT',
                body: JSON.stringify({ currency: e.target.value }),
              });
              setUser({ ...user!, ...data.profile });
              toast('Currency updated', 'success');
            } catch (err) {
              toast(err instanceof Error ? err.message : 'Failed', 'error');
            }
          }}
        >
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="CAD">CAD — Canadian Dollar</option>
          <option value="AUD">AUD — Australian Dollar</option>
          <option value="SOS">SOS — Somali Shilling</option>
        </Select>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="font-display font-semibold text-lg">Categories</h2>
        <ul className="divide-y divide-border">
          {expenseCats.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3 text-sm">
              <span>{c.name}</span>
              <button
                type="button"
                className="text-expense text-xs font-medium"
                onClick={() => removeCategory(c.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            placeholder="New category"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={addCategory}>
            Add
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="font-display font-semibold text-lg">Appearance</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={async () => {
                setTheme(t);
                try {
                  const data = await api<{ profile: User }>('/api/settings/profile', {
                    method: 'PUT',
                    body: JSON.stringify({ theme: t }),
                  });
                  setUser({ ...user!, ...data.profile });
                  document.documentElement.classList.toggle('dark', t === 'dark');
                } catch (err) {
                  toast(err instanceof Error ? err.message : 'Failed', 'error');
                }
              }}
              className={`rounded-xl border p-4 text-left capitalize ${
                theme === t
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border'
              }`}
            >
              {t} Mode
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h2 className="font-display font-semibold text-lg">Data</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" onClick={exportData} fullWidth>
            <Download size={16} /> Export Transactions
          </Button>
          <label className="flex-1">
            <span className="sr-only">Import</span>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
              }}
            />
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 h-11 border border-border bg-surface text-sm font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <Upload size={16} /> Import Transactions
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h2 className="font-display font-semibold text-lg">Security</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" onClick={() => setPwOpen(true)} fullWidth>
            Change Password
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              logout();
              toast('Logged out');
            }}
            fullWidth
          >
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </section>

      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Change Password">
        <form onSubmit={changePassword} className="space-y-4">
          <Field label="Current password">
            <Input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="New password">
            <Input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" fullWidth>
            Update Password
          </Button>
        </form>
      </Modal>
    </div>
  );
}
