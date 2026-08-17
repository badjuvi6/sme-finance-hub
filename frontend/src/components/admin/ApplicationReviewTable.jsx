import { useState } from 'react';
import { Inbox, Check, X, RotateCcw } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency, formatDate, getInitials } from '../../utils/format';
import { LOAN_STATUSES } from '../../utils/constants';

function ReviewRow({ application, onUpdateStatus }) {
  const [notes, setNotes] = useState(application.reviewNotes || '');
  const [saving, setSaving] = useState(null);

  const handleUpdate = async (status) => {
    setSaving(status);
    try {
      await onUpdateStatus(application, status, notes);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-card ring-1 ring-ink-50">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-paper">
            {getInitials(application.user?.name)}
          </div>
          <div>
            <p className="font-medium text-ink-800">{application.businessName}</p>
            <p className="text-sm text-ink-400">
              {application.user?.name} · {application.businessType} · {application.yearsInOperation} yrs in operation
            </p>
            <p className="mt-1 text-xs text-ink-300">Submitted {formatDate(application.createdAt)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="num text-lg font-semibold text-ink-800">{formatCurrency(application.requestedAmount)}</p>
          <p className="text-xs text-ink-400">{application.fundingType}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-paper-dark/40 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Purpose</p>
          <p className="mt-1 text-sm text-ink-600">{application.purpose}</p>
        </div>
        <div className="rounded-lg bg-paper-dark/40 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Avg. monthly revenue</p>
          <p className="num mt-1 text-sm text-ink-600">{formatCurrency(application.monthlyRevenue)}</p>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor={`notes-${application._id}`} className="mb-1 block text-xs font-medium text-ink-500">
          Review notes
        </label>
        <textarea
          id={`notes-${application._id}`}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add context for this decision (visible to the applicant)"
          className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status={application.status} />
        <div className="flex gap-2">
          {application.status !== 'Under Review' && (
            <button
              type="button"
              onClick={() => handleUpdate('Under Review')}
              disabled={saving !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-2 text-sm font-medium text-ink-500 transition hover:bg-ink-50 disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {saving === 'Under Review' ? 'Saving…' : 'Reopen'}
            </button>
          )}
          {application.status !== 'Rejected' && (
            <button
              type="button"
              onClick={() => handleUpdate('Rejected')}
              disabled={saving !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brick-200 bg-brick-50 px-3 py-2 text-sm font-medium text-brick-700 transition hover:bg-brick-100 disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" />
              {saving === 'Rejected' ? 'Saving…' : 'Reject'}
            </button>
          )}
          {application.status !== 'Approved' && (
            <button
              type="button"
              onClick={() => handleUpdate('Approved')}
              disabled={saving !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-paper transition hover:bg-emerald-800 disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" />
              {saving === 'Approved' ? 'Saving…' : 'Approve'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationReviewTable({ applications, statusFilter, onStatusFilterChange, onUpdateStatus, loading }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All statuses</option>
          {LOAN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <p className="text-sm text-ink-400">
          {loading ? 'Loading…' : `${applications.length} application${applications.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {!loading && applications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white px-6 py-16 text-center shadow-card ring-1 ring-ink-50">
          <Inbox className="h-8 w-8 text-ink-200" />
          <p className="text-sm font-medium text-ink-500">No applications match this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <ReviewRow key={app._id} application={app} onUpdateStatus={onUpdateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
