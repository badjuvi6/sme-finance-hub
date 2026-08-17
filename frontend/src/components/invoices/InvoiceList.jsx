import { Inbox, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import { INVOICE_STATUSES, STATUS_STYLES } from '../../utils/constants';

export default function InvoiceList({ invoices, statusFilter, onStatusFilterChange, onStatusChange, onDelete, loading }) {
  return (
    <div className="rounded-xl bg-white shadow-card ring-1 ring-ink-50">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-50 px-5 py-4">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All statuses</option>
          {INVOICE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <p className="ml-auto text-sm text-ink-400">
          {loading ? 'Loading…' : `${invoices.length} invoice${invoices.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {!loading && invoices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <Inbox className="h-8 w-8 text-ink-200" />
          <p className="text-sm font-medium text-ink-500">No invoices match these filters</p>
          <p className="text-sm text-ink-300">Create your first invoice to start tracking payments.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-50 text-xs uppercase tracking-wide text-ink-300">
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Due date</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice._id} className="border-b border-ink-50 last:border-0 hover:bg-paper-dark/40">
                  <td className="num px-5 py-3.5 font-medium text-ink-700 whitespace-nowrap">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink-700">{invoice.clientName}</p>
                    {invoice.clientEmail && <p className="text-xs text-ink-300">{invoice.clientEmail}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-ink-500 whitespace-nowrap">{formatDate(invoice.dueDate)}</td>
                  <td className="num px-5 py-3.5 text-right font-semibold text-ink-800 whitespace-nowrap">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={invoice.status}
                      onChange={(e) => onStatusChange(invoice, e.target.value)}
                      className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${STATUS_STYLES[invoice.status]}`}
                    >
                      {INVOICE_STATUSES.map((status) => (
                        <option key={status} value={status} className="bg-white text-ink-700">
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(invoice)}
                      className="rounded-md p-1.5 text-ink-300 transition hover:bg-brick-50 hover:text-brick-600"
                      aria-label={`Delete invoice ${invoice.invoiceNumber}`}
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
