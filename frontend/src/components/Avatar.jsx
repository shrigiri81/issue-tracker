// Palette cycles for avatar background generation
const PALETTES = [
  'bg-[#dfe0ff] text-[#000965]',
  'bg-[#dae2fd] text-[#131b2e]',
  'bg-[#d3e4fe] text-[#0b1c30]',
  'bg-[#dce9ff] text-[#213145]',
  'bg-[#e5eeff] text-[#0b1c30]',
]

function initials(name) {
  if (!name) return '?'
  return name
    .split(/[\s_]+/)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

function palette(name) {
  if (!name) return PALETTES[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return PALETTES[hash % PALETTES.length]
}

export default function Avatar({ name, size = 'md', className = '' }) {
  const sizeClass = {
    xs: 'w-4 h-4 text-[8px]',
    sm: 'w-6 h-6 text-[9px]',
    md: 'w-7 h-7 text-[11px]',
    lg: 'w-9 h-9 text-[13px]',
  }[size] || 'w-7 h-7 text-[11px]'

  return (
    <div
      className={`${sizeClass} ${palette(name)} rounded-full flex items-center justify-center font-semibold shrink-0 ${className}`}
      title={name}
    >
      {initials(name)}
    </div>
  )
}
