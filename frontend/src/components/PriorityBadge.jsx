import { ChevronsUp, ChevronUp, Minus, ChevronDown } from 'lucide-react'

const PRIORITY_MAP = {
  URGENT: {
    label: 'Urgent',
    icon: ChevronsUp,
    text: 'text-rose-700 bg-rose-50 border border-rose-200/60',
    iconColor: 'text-rose-600',
  },
  HIGH: {
    label: 'High',
    icon: ChevronUp,
    text: 'text-orange-700 bg-orange-50 border border-orange-200/60',
    iconColor: 'text-orange-600',
  },
  MEDIUM: {
    label: 'Medium',
    icon: Minus,
    text: 'text-amber-700 bg-amber-50 border border-amber-200/60',
    iconColor: 'text-amber-600',
  },
  LOW: {
    label: 'Low',
    icon: ChevronDown,
    text: 'text-slate-600 bg-slate-50 border border-slate-200/60',
    iconColor: 'text-slate-400',
  },
}

export default function PriorityBadge({ priority }) {
  const key = (priority || 'MEDIUM').toUpperCase()
  const cfg = PRIORITY_MAP[key] || PRIORITY_MAP.MEDIUM
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${cfg.text}`}>
      <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
      {cfg.label}
    </span>
  )
}
