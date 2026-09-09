import { Link } from 'react-router-dom'
import { GripVertical, Users } from 'lucide-react'
import type { AccessibleCard } from '../types'
import { IconGlyph } from '../components/IconGlyph'

interface CardGridItemProps {
  card: AccessibleCard
  /** Props della maniglia di trascinamento (dnd-kit); assente = riordino non attivo qui. */
  dragHandle?: Record<string, unknown>
}

export function CardGridItem({ card, dragHandle }: CardGridItemProps) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300">
      {dragHandle && (
        <button
          type="button"
          {...dragHandle}
          aria-label="Trascina per riordinare"
          className="absolute right-1 top-1 flex h-7 w-7 touch-none items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
      )}
      <Link to={`/cards/${card.id}`} className="flex flex-col items-center gap-2 pt-2 text-center active:opacity-70">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: card.color }}
        >
          <IconGlyph icon={card.icon} size={26} className="text-white" />
        </div>
        <div className="min-w-0 w-full">
          <p className="line-clamp-2 text-xs font-medium leading-tight text-slate-900">{card.label}</p>
          {card.access !== 'owner' && (
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400">
              <Users size={10} />
              condivisa
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
