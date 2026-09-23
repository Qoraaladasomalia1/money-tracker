export type TxType = 'received' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string;
  received_from: string | null;
  note: string;
  date: string;
  time: string;
  balance_after: number;
  created_at?: string;
}

export interface Summary {
  balance: number;
  totalReceived: number;
  totalSpent: number;
  todaySpending: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  theme: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TxType;
}

export type ReportType = 'all' | 'expense' | 'received';

export interface ReportMonth {
  monthKey: string;
  monthLabel: string;
  lines: ReportLine[];
  totalReceived: number;
  totalSpent: number;
  remaining: number;
  count: number;
}

export interface ReportLine {
  index: number;
  id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string;
  received_from: string | null;
  note: string;
  date: string;
  time: string;
  monthKey?: string;
  dateLabel: string;
  timeLabel: string;
}

export interface Report {
  from: string | null;
  to: string | null;
  type: ReportType;
  title: string;
  periodLabel: string;
  totalReceived: number;
  totalSpent: number;
  remaining: number;
  categoryBreakdown: { category: string; amount: number }[];
  lines: ReportLine[];
  months: ReportMonth[];
  shareText: string;
  transactionCount: number;
}

export function formatMoney(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatSigned(amount: number, type: TxType, currency = 'USD') {
  const sign = type === 'received' ? '+' : '-';
  return `${sign}${formatMoney(amount, currency)}`;
}
