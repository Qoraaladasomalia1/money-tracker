import { useEffect, useState } from 'react';
import { Copy, Download, ImageIcon, Share2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api';
import type { Report, ReportMonth, ReportType } from '../lib/types';
import { formatMoney, formatSigned } from '../lib/types';
import { downloadReportLetterImage, downloadReportPdf } from '../lib/reportPdf';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { SummaryCard } from '../components/SummaryCard';
import { useToast } from '../components/ui/Toast';

const REPORT_TYPES: { id: ReportType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'expense', label: 'Expenses' },
  { id: 'received', label: 'Income' },
];

type Period = 'daily' | 'weekly' | 'monthly' | 'all';

function monthsFromReport(report: Report): ReportMonth[] {
  if (report.months?.length) return report.months;
  if (!report.lines?.length) return [];
  return [
    {
      monthKey: 'all',
      monthLabel: 'Transactions',
      lines: report.lines,
      totalReceived: report.totalReceived,
      totalSpent: report.totalSpent,
      remaining: report.remaining,
      count: report.lines.length,
    },
  ];
}

export function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency || 'USD';
  const [period, setPeriod] = useState<Period>('all');
  const [reportType, setReportType] = useState<ReportType>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = async (opts?: {
    period?: Period;
    from?: string;
    to?: string;
    type?: ReportType;
  }) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      const type = opts?.type ?? reportType;
      q.set('type', type);
      if (opts?.from || from) q.set('from', opts?.from || from);
      if (opts?.to || to) q.set('to', opts?.to || to);
      if (!opts?.from && !from) q.set('period', opts?.period || period);
      const data = await api<Report>(`/api/reports?${q.toString()}`);
      setReport(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ period: 'all', type: 'all' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.shareText);
      toast('Report copied', 'success');
    } catch {
      toast('Could not copy', 'error');
    }
  };

  const shareReport = async () => {
    if (!report) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: report.title || 'Money Report',
          text: report.shareText,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await copyReport();
  };

  const downloadPdf = async () => {
    if (!report) return;
    setExporting(true);
    try {
      await downloadReportPdf(report, user, currency);
      toast('PDF letter downloaded', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'PDF export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const downloadLetterImage = async () => {
    if (!report) return;
    setExporting(true);
    try {
      await downloadReportLetterImage(report, user, currency);
      toast('Letter image downloaded', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Image export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const months = report ? monthsFromReport(report) : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Reports</h1>
        <p className="text-sm text-muted mt-1">
          Monthly line-item reports — download as PDF letter or letter image.
        </p>
      </header>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
          Report type
        </p>
        <div className="flex gap-2 overflow-x-auto">
          {REPORT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setReportType(t.id);
                load({
                  type: t.id,
                  period: from ? undefined : period,
                  from: from || undefined,
                  to: to || undefined,
                });
              }}
              className={`shrink-0 h-9 px-4 rounded-full text-sm font-medium border transition ${
                reportType === t.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface border-border text-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
          Period
        </p>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriod(p);
                setFrom('');
                setTo('');
                load({ period: p, type: reportType });
              }}
              className={`shrink-0 h-9 px-4 rounded-full text-sm font-medium border capitalize ${
                period === p && !from
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface border-border text-muted'
              }`}
            >
              {p === 'all' ? 'All months' : p}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <Field label="From">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Button
          onClick={() => load({ from, to, type: reportType })}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Generating…' : 'Generate Report'}
        </Button>
      </div>

      {report && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {report.type !== 'expense' && (
              <SummaryCard
                label="Total Received"
                value={formatSigned(report.totalReceived, 'received', currency)}
                tone="success"
              />
            )}
            {report.type !== 'received' && (
              <SummaryCard
                label="Total Spent"
                value={formatSigned(report.totalSpent, 'expense', currency)}
                tone="expense"
              />
            )}
            {report.type === 'all' && (
              <SummaryCard
                label="Remaining"
                value={formatMoney(report.remaining, currency)}
              />
            )}
            {report.type !== 'all' && (
              <SummaryCard
                label="Transactions"
                value={String(report.transactionCount)}
              />
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold">{report.title}</h2>
                <p className="text-sm text-muted">{report.periodLabel}</p>
              </div>
              <p className="text-sm text-muted">
                {report.transactionCount} line
                {report.transactionCount === 1 ? '' : 's'}
                {months.length > 1 ? ` · ${months.length} months` : ''}
              </p>
            </div>

            {months.length === 0 ? (
              <p className="p-6 text-sm text-muted">No transactions in this period.</p>
            ) : (
              <div className="divide-y divide-border">
                {months.map((month) => (
                  <div key={month.monthKey}>
                    <div className="px-5 py-3 bg-canvas flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h3 className="font-display font-semibold text-ink">
                        {month.monthLabel}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted">
                        {report.type !== 'expense' && (
                          <span className="text-success font-medium mr-3">
                            +{formatMoney(month.totalReceived, currency)}
                          </span>
                        )}
                        {report.type !== 'received' && (
                          <span className="text-expense font-medium mr-3">
                            -{formatMoney(month.totalSpent, currency)}
                          </span>
                        )}
                        {report.type === 'all' && (
                          <span className="font-medium text-ink">
                            Rem {formatMoney(month.remaining, currency)}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold w-10">#</th>
                            <th className="px-4 py-3 font-semibold">Date</th>
                            <th className="px-4 py-3 font-semibold">Description</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {month.lines.map((line) => (
                            <tr
                              key={line.id}
                              className="border-b border-border last:border-0 hover:bg-canvas/80"
                            >
                              <td
                                className={`px-4 py-3.5 font-semibold tabular ${
                                  line.type === 'received'
                                    ? 'text-success'
                                    : 'text-expense'
                                }`}
                              >
                                {formatSigned(line.amount, line.type, currency)}
                              </td>
                              <td className="px-4 py-3.5 text-muted tabular">
                                {line.index}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-medium">{line.dateLabel}</div>
                                <div className="text-xs text-muted">
                                  {line.timeLabel}
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-medium text-ink">
                                  {line.description}
                                </div>
                                {line.note ? (
                                  <div className="text-xs text-muted mt-0.5">
                                    {line.note}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-4 py-3.5 text-muted">
                                {line.category}
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    line.type === 'received'
                                      ? 'bg-success/10 text-success'
                                      : 'bg-expense/10 text-expense'
                                  }`}
                                >
                                  {line.type === 'received' ? 'Income' : 'Expense'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden divide-y divide-border">
                      {month.lines.map((line) => (
                        <div key={line.id} className="px-4 py-4 flex gap-3">
                          <p
                            className={`font-semibold tabular text-sm shrink-0 w-20 ${
                              line.type === 'received' ? 'text-success' : 'text-expense'
                            }`}
                          >
                            {formatSigned(line.amount, line.type, currency)}
                          </p>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-ink truncate">
                              {line.description}
                            </p>
                            <p className="text-xs text-muted mt-1">
                              {line.category} · {line.dateLabel}, {line.timeLabel}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-border text-sm flex flex-wrap gap-x-4 gap-y-1">
                      <span className="font-medium text-ink">
                        {month.monthLabel} total
                      </span>
                      {report.type !== 'expense' && (
                        <span className="text-success tabular">
                          Received {formatSigned(month.totalReceived, 'received', currency)}
                        </span>
                      )}
                      {report.type !== 'received' && (
                        <span className="text-expense tabular">
                          Spent {formatSigned(month.totalSpent, 'expense', currency)}
                        </span>
                      )}
                      {report.type === 'all' && (
                        <span className="text-ink tabular">
                          Remaining {formatMoney(month.remaining, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {report.categoryBreakdown.length > 0 && report.type !== 'received' && (
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-display text-lg font-semibold mb-4">
                Spending by Category
              </h2>
              <div className="h-56 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v) =>
                        typeof v === 'number' ? formatMoney(v, currency) : v
                      }
                    />
                    <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <h2 className="font-display text-lg font-semibold">Share & Download</h2>
            <pre className="whitespace-pre-wrap text-sm bg-canvas rounded-xl p-4 border border-border font-sans leading-relaxed max-h-64 overflow-y-auto">
              {report.shareText}
            </pre>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="secondary" onClick={copyReport} fullWidth>
                <Copy size={16} /> Copy Report
              </Button>
              <Button variant="secondary" onClick={shareReport} fullWidth>
                <Share2 size={16} /> Share Report
              </Button>
              <Button onClick={downloadPdf} disabled={exporting} fullWidth>
                <Download size={16} />
                {exporting ? 'Creating…' : 'Download PDF Letter'}
              </Button>
              <Button
                variant="secondary"
                onClick={downloadLetterImage}
                disabled={exporting}
                fullWidth
              >
                <ImageIcon size={16} />
                {exporting ? 'Creating…' : 'Download Letter Image'}
              </Button>
            </div>
            <p className="text-xs text-muted">
              PDF and letter image use the same design: amount first, month sections, and monthly totals.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
