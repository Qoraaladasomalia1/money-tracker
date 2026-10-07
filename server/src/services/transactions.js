import { getMany, getOne, query } from '../db/index.js';

/** Whole dollars without forced .00; keeps decimals when present (e.g. 240.24) */
function formatAmount(n) {
  const value = Math.round(Number(n) * 100) / 100;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeTx(row) {
  if (!row) return row;
  const time = String(row.time || '').slice(0, 5);
  const date =
    row.date instanceof Date
      ? row.date.toISOString().slice(0, 10)
      : String(row.date || '').slice(0, 10);
  return {
    ...row,
    amount: Number(row.amount),
    date,
    time,
  };
}

export async function getSortedTransactions(userId) {
  const rows = await getMany(
    `SELECT *
     FROM transactions
     WHERE user_id = $1
     ORDER BY date ASC, time ASC, created_at ASC`,
    [userId]
  );
  return rows.map(normalizeTx);
}

export function withRunningBalances(transactions) {
  let balance = 0;
  return transactions.map((tx) => {
    balance += tx.type === 'received' ? tx.amount : -tx.amount;
    return { ...tx, balance_after: Math.round(balance * 100) / 100 };
  });
}

export async function getTransactionsWithBalance(
  userId,
  { newestFirst = true } = {}
) {
  const withBalance = withRunningBalances(await getSortedTransactions(userId));
  return newestFirst ? [...withBalance].reverse() : withBalance;
}

export async function getSummary(userId) {
  const txs = await getSortedTransactions(userId);
  const today = new Date().toISOString().slice(0, 10);

  let balance = 0;
  let totalReceived = 0;
  let totalSpent = 0;
  let todaySpending = 0;

  for (const tx of txs) {
    if (tx.type === 'received') {
      balance += tx.amount;
      totalReceived += tx.amount;
    } else {
      balance -= tx.amount;
      totalSpent += tx.amount;
      if (tx.date === today) todaySpending += tx.amount;
    }
  }

  return {
    balance: Math.round(balance * 100) / 100,
    totalReceived: Math.round(totalReceived * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    todaySpending: Math.round(todaySpending * 100) / 100,
  };
}

function formatLongDate(isoDate) {
  try {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function formatTime(date, time) {
  try {
    return new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return time;
  }
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function lineLabel(tx) {
  if (tx.type === 'received') {
    return tx.received_from
      ? `Money from ${tx.received_from}`
      : tx.description || tx.category;
  }
  return tx.description || tx.category;
}

export async function getReport(userId, { from, to, type = 'all' } = {}) {
  let txs = await getSortedTransactions(userId);

  if (from) txs = txs.filter((t) => t.date >= from);
  if (to) txs = txs.filter((t) => t.date <= to);

  const reportType = ['all', 'expense', 'received'].includes(type) ? type : 'all';
  if (reportType === 'expense') txs = txs.filter((t) => t.type === 'expense');
  if (reportType === 'received') txs = txs.filter((t) => t.type === 'received');

  let totalReceived = 0;
  let totalSpent = 0;
  const byCategory = {};

  for (const tx of txs) {
    if (tx.type === 'received') {
      totalReceived += tx.amount;
    } else {
      totalSpent += tx.amount;
      byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
    }
  }

  if (reportType === 'received') {
    for (const tx of txs) {
      byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
    }
  }

  const remaining = Math.round((totalReceived - totalSpent) * 100) / 100;
  const categoryBreakdown = Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    }))
    .sort((a, b) => b.amount - a.amount);

  const lines = txs.map((tx, index) => ({
    index: index + 1,
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    category: tx.category,
    description: lineLabel(tx),
    received_from: tx.received_from,
    note: tx.note || '',
    date: tx.date,
    time: tx.time,
    monthKey: tx.date.slice(0, 7),
    dateLabel: formatLongDate(tx.date),
    timeLabel: formatTime(tx.date, tx.time),
  }));

  const monthMap = new Map();
  for (const line of lines) {
    if (!monthMap.has(line.monthKey)) {
      monthMap.set(line.monthKey, {
        monthKey: line.monthKey,
        monthLabel: formatMonthLabel(line.monthKey),
        lines: [],
        totalReceived: 0,
        totalSpent: 0,
      });
    }
    const group = monthMap.get(line.monthKey);
    group.lines.push(line);
    if (line.type === 'received') group.totalReceived += line.amount;
    else group.totalSpent += line.amount;
  }

  const months = [...monthMap.values()].map((g) => ({
    ...g,
    totalReceived: Math.round(g.totalReceived * 100) / 100,
    totalSpent: Math.round(g.totalSpent * 100) / 100,
    remaining: Math.round((g.totalReceived - g.totalSpent) * 100) / 100,
    count: g.lines.length,
  }));

  const typeTitle =
    reportType === 'expense'
      ? 'Expenses Report'
      : reportType === 'received'
        ? 'Income Report'
        : 'Full Money Report';

  const periodLabel =
    !from && !to
      ? 'All transactions'
      : from && to
        ? from === to
          ? formatLongDate(from)
          : `${formatLongDate(from)} — ${formatLongDate(to)}`
        : formatLongDate(to || from || new Date().toISOString().slice(0, 10));

  const monthBlocks = months.flatMap((month) => [
    '',
    `—— ${month.monthLabel} ——`,
    ...month.lines.map((line) => {
      const sign = line.type === 'received' ? '+' : '-';
      const notePart = line.note ? ` | Note: ${line.note}` : '';
      return `${sign}$${formatAmount(line.amount)}  ${line.description} | ${line.category} | ${line.dateLabel}, ${line.timeLabel}${notePart}`;
    }),
    `Month total received: +$${formatAmount(month.totalReceived)}`,
    `Month total spent: -$${formatAmount(month.totalSpent)}`,
    ...(reportType === 'all'
      ? [`Month remaining: $${formatAmount(month.remaining)}`]
      : []),
  ]);

  const shareText = [
    typeTitle,
    periodLabel,
    '',
    ...(reportType !== 'expense'
      ? [`Money Received: +$${formatAmount(totalReceived)}`]
      : []),
    ...(reportType !== 'received'
      ? [`Total Spent: -$${formatAmount(totalSpent)}`]
      : []),
    ...(reportType === 'all'
      ? [`Remaining Balance: $${formatAmount(remaining)}`]
      : []),
    '',
    'Transactions by month:',
    ...(monthBlocks.length ? monthBlocks : ['None']),
  ].join('\n');

  return {
    from: from || null,
    to: to || null,
    type: reportType,
    title: typeTitle,
    periodLabel,
    totalReceived: Math.round(totalReceived * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    remaining,
    categoryBreakdown,
    lines,
    months,
    shareText,
    transactionCount: txs.length,
  };
}

// Re-export for routes that need raw inserts
export { query, getOne, getMany };
