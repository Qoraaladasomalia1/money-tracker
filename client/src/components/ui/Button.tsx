import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const styles: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover shadow-sm',
  secondary:
    'bg-surface text-ink border border-border hover:bg-slate-50 dark:hover:bg-slate-800',
  danger: 'bg-expense/10 text-expense hover:bg-expense/20',
  ghost: 'text-muted hover:bg-slate-100 dark:hover:bg-slate-800',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  children,
  fullWidth,
  className = '',
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 h-11 md:h-10 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
