import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, ClipboardList, CheckCircle2, Clock, XCircle, Landmark, Loader2 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import StatCard from '../../components/common/StatCard';
import { getPlatformOverview, getAllSMEs } from '../../api/adminApi';
import { formatCurrency, formatDate, getInitials } from '../../utils/format';

export default function AdminOverview() {
  const { openSidebar } = useOutletContext();
  const [overview, setOverview] = useState(null);
  const [smes, setSmes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [overviewRes, smesRes] = await Promise.all([getPlatformOverview(), getAllSMEs()]);
    setOverview(overviewRes.data);
    setSmes(smesRes.data.smes);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !overview) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <Navbar title="Platform overview" subtitle="Monitor registered businesses and financing activity" onMenuClick={openSidebar} />
      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Registered SMEs" value={overview.totalSMEs} icon={Users} tone="emerald" />
          <StatCard label="Total loan requests" value={overview.totalLoanRequests} icon={ClipboardList} tone="ink" />
          <StatCard
            label="Under review"
            value={overview.applicationsUnderReview}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Total requested"
            value={formatCurrency(overview.totalRequestedAmount)}
            icon={Landmark}
            tone="ink"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Approved applications" value={overview.applicationsApproved} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Rejected applications" value={overview.applicationsRejected} icon={XCircle} tone="brick" />
          <StatCard label="Total approved amount" value={formatCurrency(overview.totalApprovedAmount)} icon={Landmark} tone="emerald" />
        </div>

        <div className="rounded-xl bg-white shadow-card ring-1 ring-ink-50">
          <div className="border-b border-ink-50 px-5 py-4">
            <h3 className="font-display text-base font-semibold text-ink-800">Registered SMEs</h3>
            <p className="text-sm text-ink-400">Every business currently using the platform</p>
          </div>
          {smes.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-300">No SMEs have registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-50 text-xs uppercase tracking-wide text-ink-300">
                    <th className="px-5 py-3 font-medium">Business</th>
                    <th className="px-5 py-3 font-medium">Owner</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {smes.map((sme) => (
                    <tr key={sme.id} className="border-b border-ink-50 last:border-0 hover:bg-paper-dark/40">
                      <td className="px-5 py-3.5 font-medium text-ink-700">{sme.businessName || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-700 text-[10px] font-semibold text-paper">
                            {getInitials(sme.name)}
                          </div>
                          <div>
                            <p className="text-ink-700">{sme.name}</p>
                            <p className="text-xs text-ink-300">{sme.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-500">{sme.businessType}</td>
                      <td className="px-5 py-3.5 text-ink-500 whitespace-nowrap">{formatDate(sme.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
