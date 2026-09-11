import { Link } from 'react-router-dom'
import { GripVertical, Users, EyeOff, Eye } from 'lucide-react'
import type { AccessibleCard } from '../types'
import { IconGlyph } from '../components/IconGlyph'

interface CardListItemProps {
  card: AccessibleCard
  /** Props della maniglia di trascinamento (dnd-kit); assente = riordino non attivo qui. */
  dragHandle?: Record<string, unknown>
  /** Mostra/nascondi visibilità: presente solo per le carte condivise (non proprie). */
  onToggleHidden?: () => void
}

export function CardListItem({ card, dragHandle, onToggleHidden }: CardListItemProps) {
  const canToggleHidden = card.access !== 'owner' && onToggleHidden

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white pr-1 shadow-sm transition hover:border-slate-300">
      {dragHandle && (
        <button
          type="button"
          {...dragHandle}
          aria-label="Trascina per riordinare"
          className="flex h-11 w-9 shrink-0 touch-none items-center justify-center text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>
      )}
      <Link
        to={`/cards/${card.id}`}
        className={`flex min-w-0 flex-1 items-center gap-3 py-3.5 active:opacity-70 ${dragHandle ? '' : 'pl-3.5'}`}
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
      {canToggleHidden && (
        <button
          type="button"
          onClick={onToggleHidden}
          aria-label={card.is_hidden ? 'Mostra di nuovo la carta' : 'Nascondi la carta'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          {card.is_hidden ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      )}
    </div>
  )
}
