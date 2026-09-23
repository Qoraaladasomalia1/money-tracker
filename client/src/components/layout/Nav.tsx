import {
  LayoutDashboard,
  Receipt,
  Plus,
  PieChart,
  Settings,
  Wallet,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../lib/types';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/add', label: 'Add Transaction', icon: Plus, accent: true },
  { to: '/reports', label: 'Reports', icon: PieChart },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { user, summary } = useAuth();

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface h-screen sticky top-0">
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
          <Wallet size={20} strokeWidth={2} />
        </div>
        <div>
          <p className="font-display font-bold text-ink leading-tight">MoneyTrack</p>
          <p className="text-xs text-muted">Personal Ledger</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, label, icon: Icon, end, accent }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              accent
                ? `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-primary text-white shadow-sm ${isActive ? 'ring-2 ring-primary/30' : ''}`
                : `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-ink'
                  }`
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 p-4 rounded-2xl border border-border bg-canvas">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">
          Available Balance
        </p>
        <p className="font-display text-xl font-bold tabular text-ink">
          {formatMoney(summary?.balance || 0, user?.currency)}
        </p>
        <p className="mt-3 text-sm font-medium text-ink truncate">{user?.name}</p>
        <p className="text-xs text-muted truncate">{user?.email}</p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const items = [
    { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/add', label: 'Add', icon: Plus, fab: true },
    { to: '/reports', label: 'Reports', icon: PieChart },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16">
        {items.map(({ to, label, icon: Icon, end, fab }) =>
          fab ? (
            <NavLink
              key={to}
              to={to}
              className="flex items-center justify-center -mt-4"
            >
              <span className="w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center">
                <Icon size={26} strokeWidth={2.25} />
              </span>
            </NavLink>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                  isActive ? 'text-primary' : 'text-muted'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.75} />
              {label}
            </NavLink>
          )
        )}
      </div>
    </nav>
  );
}
