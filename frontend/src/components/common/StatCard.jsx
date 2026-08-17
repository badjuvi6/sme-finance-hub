const TONE_STYLES = {
  emerald: { icon: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-100' },
  brick: { icon: 'bg-brick-50 text-brick-700', ring: 'ring-brick-100' },
  amber: { icon: 'bg-amber-50 text-amber-700', ring: 'ring-amber-100' },
  ink: { icon: 'bg-ink-50 text-ink-700', ring: 'ring-ink-100' },
};

export default function StatCard({ label, value, icon: Icon, tone = 'ink', subtext }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.ink;

  return (
    <div className={`rounded-xl bg-white p-5 shadow-card ring-1 ${styles.ring}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-400">{label}</p>
          <p className="num mt-2 text-2xl font-semibold text-ink-800">{value}</p>
          {subtext && <p className="mt-1 text-xs text-ink-400">{subtext}</p>}
        </div>
        {Icon && (
          <div className={`rounded-lg p-2.5 ${styles.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
