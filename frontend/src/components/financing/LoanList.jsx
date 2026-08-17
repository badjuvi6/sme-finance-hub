import { Landmark, Inbox } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

export default function LoanList({ applications, loading }) {
  if (!loading && applications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-white px-6 py-16 text-center shadow-card ring-1 ring-ink-50">
        <Inbox className="h-8 w-8 text-ink-200" />
        <p className="text-sm font-medium text-ink-500">No financing applications yet</p>
        <p className="text-sm text-ink-300">Submit a request above to apply for a loan or grant.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <div key={app._id} className="rounded-xl bg-white p-5 shadow-card ring-1 ring-ink-50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-ink-800">
                  {app.fundingType} · <span className="num">{formatCurrency(app.requestedAmount)}</span>
                </p>
                <p className="mt-0.5 text-sm text-ink-400">Submitted {formatDate(app.createdAt)}</p>
              </div>
            </div>
            <StatusBadge status={app.status} />
          </div>
          <p className="mt-3 text-sm text-ink-500">{app.purpose}</p>
          {app.reviewNotes && (
            <div className="mt-3 rounded-lg bg-paper-dark/50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Reviewer notes</p>
              <p className="mt-1 text-sm text-ink-600">{app.reviewNotes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
