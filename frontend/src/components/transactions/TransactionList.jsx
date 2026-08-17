import { ArrowUpRight, ArrowDownRight, Trash2, Inbox } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import { TRANSACTION_CATEGORIES } from '../../utils/constants';

export default function TransactionList({ transactions, filters, onFilterChange, onDelete, loading }) {
  return (
    <div className="rounded-xl bg-white shadow-card ring-1 ring-ink-50">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-50 px-5 py-4">
        <select
          value={filters.type}
          onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
          className="rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
          className="rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All categories</option>
          {TRANSACTION_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <p className="ml-auto text-sm text-ink-400">
          {loading ? 'Loading…' : `${transactions.length} record${transactions.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {!loading && transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <Inbox className="h-8 w-8 text-ink-200" />
          <p className="text-sm font-medium text-ink-500">No transactions match these filters</p>
          <p className="text-sm text-ink-300">Log your first income or expense to see it here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-50 text-xs uppercase tracking-wide text-ink-300">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-b border-ink-50 last:border-0 hover:bg-paper-dark/40">
                  <td className="px-5 py-3.5 text-ink-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-ink-50 px-2 py-1 text-xs font-medium text-ink-600">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-500">{tx.description || '—'}</td>
                  <td
                    className={`num px-5 py-3.5 text-right font-semibold whitespace-nowrap ${
                      tx.type === 'income' ? 'text-emerald-700' : 'text-brick-700'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(tx)}
                      className="rounded-md p-1.5 text-ink-300 transition hover:bg-brick-50 hover:text-brick-600"
                      aria-label={`Delete transaction from ${formatDate(tx.date)}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
