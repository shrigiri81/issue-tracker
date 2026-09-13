// Status configuration
const STATUS_MAP = {
  OPEN: {
    label: 'Open',
    dot: 'bg-slate-400',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dot: 'bg-amber-500 animate-pulse',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  BLOCKED: {
    label: 'Blocked',
    dot: 'bg-rose-500',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  RESOLVED: {
    label: 'Resolved',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  CLOSED: {
    label: 'Closed',
    dot: 'bg-slate-400',
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    border: 'border-slate-200',
  },
  MERGED: {
    label: 'Merged',
    dot: 'bg-violet-500',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
  },
}

export default function StatusBadge({ status }) {
  const key = (status || 'OPEN').toUpperCase().replace(' ', '_')
  const cfg = STATUS_MAP[key] || STATUS_MAP.OPEN
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
