import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/format';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-ink-50 bg-white px-3 py-2 shadow-lift">
      <p className="text-xs font-semibold text-ink-500">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="num text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function CashFlowChart({ data }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-card ring-1 ring-ink-50">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-800">Cash flow, last 6 months</h3>
          <p className="text-sm text-ink-400">Income against expenses, month over month</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" /> Income
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brick-500" /> Expenses
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#146C4B" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#146C4B" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B3492D" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#B3492D" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7C92B2' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#7C92B2' }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(value) => `${Math.round(value / 100) / 10}k`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="income" name="Income" stroke="#146C4B" strokeWidth={2} fill="url(#incomeFill)" />
            <Area type="monotone" dataKey="expense" name="Expenses" stroke="#B3492D" strokeWidth={2} fill="url(#expenseFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
