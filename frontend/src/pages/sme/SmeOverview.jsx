import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { TrendingUp, TrendingDown, FileClock, PiggyBank, Loader2 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import CashFlowChart from '../../components/dashboard/CashFlowChart';
import { getTransactionSummary, getTransactions } from '../../api/transactionApi';
import { getInvoiceSummary, getInvoices } from '../../api/invoiceApi';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export default function SmeOverview() {
  const { openSidebar } = useOutletContext();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [invoiceSummary, setInvoiceSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [summaryRes, invoiceSummaryRes, transactionsRes, invoicesRes] = await Promise.all([
      getTransactionSummary(),
      getInvoiceSummary(),
      getTransactions(),
      getInvoices(),
    ]);
    setSummary(summaryRes.data);
    setInvoiceSummary(invoiceSummaryRes.data);
    setRecentTransactions(transactionsRes.data.transactions.slice(0, 5));
    setRecentInvoices(invoicesRes.data.invoices.slice(0, 5));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !summary || !invoiceSummary) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <Navbar
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle={user?.businessName || 'Here is how your business is doing'}
        onMenuClick={openSidebar}
      />
      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total revenue"
            value={formatCurrency(summary.totalRevenue)}
            icon={TrendingUp}
            tone="emerald"
          />
          <StatCard
            label="Total expenses"
            value={formatCurrency(summary.totalExpenses)}
            icon={TrendingDown}
            tone="brick"
          />
          <StatCard
            label="Pending invoices"
            value={formatCurrency(invoiceSummary.pendingInvoicesAmount)}
            subtext={`${invoiceSummary.pendingInvoicesCount} invoice${invoiceSummary.pendingInvoicesCount === 1 ? '' : 's'}`}
            icon={FileClock}
            tone="amber"
          />
          <StatCard
            label="Net profit"
            value={formatCurrency(summary.netProfit)}
            icon={PiggyBank}
            tone={summary.netProfit >= 0 ? 'emerald' : 'brick'}
          />
        </div>

        <CashFlowChart data={summary.monthlyCashFlow} />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white shadow-card ring-1 ring-ink-50">
            <div className="border-b border-ink-50 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-ink-800">Recent transactions</h3>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-300">No transactions logged yet.</p>
            ) : (
              <ul className="divide-y divide-ink-50">
                {recentTransactions.map((tx) => (
                  <li key={tx._id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-ink-700">{tx.category}</p>
                      <p className="text-xs text-ink-300">{formatDate(tx.date)}</p>
                    </div>
                    <p className={`num text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-700' : 'text-brick-700'}`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl bg-white shadow-card ring-1 ring-ink-50">
            <div className="border-b border-ink-50 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-ink-800">Recent invoices</h3>
            </div>
            {recentInvoices.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-300">No invoices created yet.</p>
            ) : (
              <ul className="divide-y divide-ink-50">
                {recentInvoices.map((invoice) => (
                  <li key={invoice._id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-ink-700">{invoice.clientName}</p>
                      <p className="text-xs text-ink-300">
                        {invoice.invoiceNumber} · Due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="num text-sm font-semibold text-ink-800">{formatCurrency(invoice.totalAmount)}</p>
                      <StatusBadge status={invoice.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
