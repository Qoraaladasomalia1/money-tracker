import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/types';

export function MoneyOverviewChart() {
  const { summary, user } = useAuth();
  const currency = user?.currency || 'USD';
  const data = [
    { name: 'Received', value: summary?.totalReceived || 0, color: '#16A34A' },
    { name: 'Expenses', value: summary?.totalSpent || 0, color: '#DC2626' },
    { name: 'Remaining', value: Math.max(summary?.balance || 0, 0), color: '#2563EB' },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted">
        No data to chart yet
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="w-full sm:w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                typeof value === 'number' ? formatMoney(value, currency) : value
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 w-full sm:w-auto">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: d.color }}
            />
            <span className="text-muted">{d.name}</span>
            <span className="ml-auto font-medium tabular">
              {formatMoney(d.value, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
