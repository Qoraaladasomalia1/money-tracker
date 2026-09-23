import type { ReactNode } from 'react';

export function SummaryCard({
  label,
  value,
  tone = 'default',
  icon,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'expense';
  icon?: ReactNode;
}) {
  const valueColor =
    tone === 'success'
      ? 'text-success'
      : tone === 'expense'
        ? 'text-expense'
        : 'text-ink';

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 md:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
          {label}
        </p>
        {icon && (
          <div className="w-9 h-9 rounded-[10px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted">
            {icon}
          </div>
        )}
      </div>
      <p className={`font-display text-xl md:text-2xl font-bold tabular ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}
