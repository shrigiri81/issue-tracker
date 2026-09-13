const PRIORITY_MAP = {
  URGENT: {
    label: 'Urgent',
    icon: 'keyboard_double_arrow_up',
    text: 'text-rose-700',
    iconColor: 'text-rose-600',
  },
  HIGH: {
    label: 'High',
    icon: 'expand_less',
    text: 'text-orange-700',
    iconColor: 'text-orange-600',
  },
  MEDIUM: {
    label: 'Medium',
    icon: 'remove',
    text: 'text-amber-700',
    iconColor: 'text-amber-600',
  },
  LOW: {
    label: 'Low',
    icon: 'expand_more',
    text: 'text-slate-600',
    iconColor: 'text-slate-400',
  },
}

export default function PriorityBadge({ priority }) {
  const key = (priority || 'MEDIUM').toUpperCase()
  const cfg = PRIORITY_MAP[key] || PRIORITY_MAP.MEDIUM
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded ${cfg.text}`}>
      <span className={`material-symbols-outlined text-[13px] ${cfg.iconColor}`}>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}
