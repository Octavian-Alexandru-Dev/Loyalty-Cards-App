import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import type { AccessibleCard } from '../types'
import { IconGlyph } from '../components/IconGlyph'

export function CardListItem({ card }: { card: AccessibleCard }) {
  return (
    <Link
      to={`/cards/${card.id}`}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-slate-300 active:scale-[0.99]"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: card.color }}
      >
        <IconGlyph icon={card.icon} size={22} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{card.label}</p>
        <p className="truncate text-sm text-slate-500">
          {card.category ?? 'Senza categoria'}
          {card.access !== 'owner' && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-400">
              <Users size={12} />
              condivisa{card.shared_by_username ? ` da @${card.shared_by_username}` : ''}
            </span>
          )}
        </p>
      </div>
    </Link>
  )
}
