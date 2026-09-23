import { jsPDF } from 'jspdf';
import type { Report, ReportMonth, User } from './types';
import { formatMoney, formatSigned } from './types';

function fileSlug(report: Report) {
  const typeSlug = report.type || 'all';
  const dateSlug = (report.to || new Date().toISOString().slice(0, 10)).replace(
    /-/g,
    ''
  );
  return `MoneyTrack-${typeSlug}-report-${dateSlug}`;
}

function monthsFor(report: Report): ReportMonth[] {
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

/** One shared letter layout used by both PDF and PNG exports */
function buildLetterElement(
  report: Report,
  user: User | null,
  currency: string
): { host: HTMLDivElement; letter: HTMLElement } {
  const months = monthsFor(report);
  const generated = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const summaryBits: string[] = [];
  if (report.type !== 'expense') {
    summaryBits.push(
      `<div style="flex:1;min-width:140px;border:1px solid #E2E8F0;border-radius:12px;padding:14px 16px;background:#F8FAFC">
        <div style="font-size:10px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.04em">Total Received</div>
        <div style="font-size:22px;font-weight:700;color:#16A34A;margin-top:6px;font-variant-numeric:tabular-nums">${formatSigned(report.totalReceived, 'received', currency)}</div>
      </div>`
    );
  }
  if (report.type !== 'received') {
    summaryBits.push(
      `<div style="flex:1;min-width:140px;border:1px solid #E2E8F0;border-radius:12px;padding:14px 16px;background:#F8FAFC">
        <div style="font-size:10px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.04em">Total Spent</div>
        <div style="font-size:22px;font-weight:700;color:#DC2626;margin-top:6px;font-variant-numeric:tabular-nums">${formatSigned(report.totalSpent, 'expense', currency)}</div>
      </div>`
    );
  }
  if (report.type === 'all') {
    summaryBits.push(
      `<div style="flex:1;min-width:140px;border:1px solid #E2E8F0;border-radius:12px;padding:14px 16px;background:#F8FAFC">
        <div style="font-size:10px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.04em">Remaining</div>
        <div style="font-size:22px;font-weight:700;color:#2563EB;margin-top:6px;font-variant-numeric:tabular-nums">${formatMoney(report.remaining, currency)}</div>
      </div>`
    );
  }

  const monthHtml = months
    .map((month) => {
      const rows = month.lines
        .map(
          (line) => `
          <tr style="border-bottom:1px solid #E2E8F0">
            <td style="padding:11px 10px;font-weight:700;color:${line.type === 'received' ? '#16A34A' : '#DC2626'};white-space:nowrap;font-variant-numeric:tabular-nums;width:96px">${formatSigned(line.amount, line.type, currency)}</td>
            <td style="padding:11px 8px;color:#64748B;width:36px;text-align:center">${line.index}</td>
            <td style="padding:11px 8px;white-space:nowrap">
              <div style="font-weight:600;color:#0F172A">${line.dateLabel}</div>
              <div style="font-size:11px;color:#64748B">${line.timeLabel}</div>
            </td>
            <td style="padding:11px 8px;color:#64748B;white-space:nowrap">${line.type === 'received' ? 'Income' : 'Expense'}</td>
            <td style="padding:11px 8px">
              <div style="font-weight:600;color:#0F172A">${escapeHtml(line.description)}</div>
              ${line.note ? `<div style="font-size:11px;color:#64748B;margin-top:2px">${escapeHtml(line.note)}</div>` : ''}
            </td>
            <td style="padding:11px 8px;color:#64748B">${escapeHtml(line.category)}</td>
          </tr>`
        )
        .join('');

      const monthTotals: string[] = [];
      if (report.type !== 'expense') {
        monthTotals.push(
          `<span style="color:#16A34A">Received ${formatSigned(month.totalReceived, 'received', currency)}</span>`
        );
      }
      if (report.type !== 'received') {
        monthTotals.push(
          `<span style="color:#DC2626">Spent ${formatSigned(month.totalSpent, 'expense', currency)}</span>`
        );
      }
      if (report.type === 'all') {
        monthTotals.push(
          `<span style="color:#0F172A">Remaining ${formatMoney(month.remaining, currency)}</span>`
        );
      }

      return `
        <section style="margin-top:28px">
          <div style="background:#F1F5F9;border:1px solid #E2E8F0;border-radius:10px;padding:11px 14px;font-weight:700;font-size:15px;color:#0F172A;margin-bottom:0">
            ${escapeHtml(month.monthLabel)}
            <span style="float:right;font-size:12px;font-weight:500;color:#64748B">${month.count} transaction${month.count === 1 ? '' : 's'}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:0">
            <thead>
              <tr style="background:#2563EB;color:#fff">
                <th style="text-align:left;padding:10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.03em">Amount</th>
                <th style="text-align:center;padding:10px 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.03em">#</th>
                <th style="text-align:left;padding:10px 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.03em">Date</th>
                <th style="text-align:left;padding:10px 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.03em">Type</th>
                <th style="text-align:left;padding:10px 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.03em">Description</th>
                <th style="text-align:left;padding:10px 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.03em">Category</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="padding:16px;color:#64748B">No transactions</td></tr>'}</tbody>
          </table>
          <div style="margin-top:0;padding:12px 14px;background:#F8FAFC;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 10px 10px;font-size:13px;font-weight:600;display:flex;flex-wrap:wrap;gap:16px">
            <span style="color:#0F172A">${escapeHtml(month.monthLabel)} totals</span>
            ${monthTotals.join('')}
          </div>
        </section>`;
    })
    .join('');

  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:816px;background:#fff;z-index:-1;';

  host.innerHTML = `
    <article id="mt-letter" style="width:816px;background:#ffffff;font-family:'Inter','Segoe UI',Arial,sans-serif;color:#0F172A;box-sizing:border-box">
      <header style="background:#2563EB;color:#fff;padding:28px 36px;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:26px;font-weight:700;letter-spacing:-0.02em">MoneyTrack</div>
          <div style="opacity:.92;margin-top:4px;font-size:13px">Personal Money Report</div>
        </div>
        <div style="text-align:right;font-size:11px;opacity:.9;line-height:1.5">
          <div>Letter format</div>
          <div>Generated ${escapeHtml(generated)}</div>
        </div>
      </header>

      <div style="padding:32px 36px 40px">
        <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.02em">${escapeHtml(report.title || 'Money Report')}</h1>
        <p style="margin:8px 0 0;color:#64748B;font-size:14px">${escapeHtml(report.periodLabel || '')}</p>
        ${
          user
            ? `<p style="margin:4px 0 0;color:#64748B;font-size:13px">Prepared for ${escapeHtml(user.name)} · ${escapeHtml(user.email)}</p>`
            : ''
        }

        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:24px">${summaryBits.join('')}</div>

        <h2 style="margin:32px 0 0;font-size:16px;font-weight:700">Transaction Details</h2>
        <p style="margin:4px 0 0;color:#64748B;font-size:12px">Amount shown first · grouped by month with monthly totals</p>

        ${
          monthHtml ||
          '<p style="margin-top:24px;color:#64748B">No transactions in this period.</p>'
        }

        <footer style="margin-top:36px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:11px;color:#94A3B8;display:flex;justify-content:space-between">
          <span>MoneyTrack · Confidential personal finance report</span>
          <span>${report.transactionCount} line${report.transactionCount === 1 ? '' : 's'}${months.length > 1 ? ` · ${months.length} months` : ''}</span>
        </footer>
      </div>
    </article>
  `;

  const letter = host.querySelector('#mt-letter') as HTMLElement;
  return { host, letter };
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderLetterCanvas(
  report: Report,
  user: User | null,
  currency: string
) {
  const html2canvas = (await import('html2canvas')).default;
  const { host, letter } = buildLetterElement(report, user, currency);
  document.body.appendChild(host);
  try {
    return await html2canvas(letter, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });
  } finally {
    document.body.removeChild(host);
  }
}

function downloadBlob(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/** PDF letter — same design as the letter image */
export async function downloadReportPdf(
  report: Report,
  user: User | null,
  currency = 'USD'
) {
  const canvas = await renderLetterCanvas(report, user, currency);
  const imgData = canvas.toDataURL('image/png');

  // US Letter: 8.5 x 11 in
  const pdf = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  // Page footers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 12, {
      align: 'right',
    });
  }

  pdf.save(`${fileSlug(report)}.pdf`);
}

/** Letter image PNG — same design and content as the PDF letter */
export async function downloadReportLetterImage(
  report: Report,
  user: User | null,
  currency = 'USD'
) {
  const canvas = await renderLetterCanvas(report, user, currency);
  downloadBlob(canvas.toDataURL('image/png'), `${fileSlug(report)}-letter.png`);
}
