import { STATUS_STYLES } from '../../utils/constants';

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-ink-50 text-ink-700 ring-1 ring-inset ring-ink-100';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}
