import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ScanLine, CreditCard, List, LayoutGrid } from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCards } from './useCards'
import { useCardOrder } from './useCardOrder'
import { CardListItem } from './CardListItem'
import { CardGridItem } from './CardGridItem'
import { EmptyState } from '../components/EmptyState'
import { Spinner } from '../components/Spinner'
import { Button } from '../components/Button'
import { useLocalStorageState } from '../lib/useLocalStorageState'
import { CARD_CATEGORIES, type AccessibleCard } from '../types'

type ViewMode = 'list' | 'grid'

function SortableCard({ card, view }: { card: AccessibleCard; view: ViewMode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  }
  const dragHandle = { ...attributes, ...listeners }

  return (
    <div ref={setNodeRef} style={style}>
      {view === 'grid' ? (
        <CardGridItem card={card} dragHandle={dragHandle} />
      ) : (
        <CardListItem card={card} dragHandle={dragHandle} />
      )}
    </div>
  )
}

export default function CardsListPage() {
  const { data: cards, isLoading, isError } = useCards()
  const { orderedCards, reorder } = useCardOrder(cards)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [view, setView] = useLocalStorageState<ViewMode>('loyalty-cards:view-mode', 'list')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const filtered = useMemo(() => {
    return orderedCards.filter((c) => {
      const matchesSearch = c.label.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !category || c.category === category
      return matchesSearch && matchesCategory
    })
  }, [orderedCards, search, category])

  const categoriesInUse = useMemo(
    () => CARD_CATEGORIES.filter((cat) => cards?.some((c) => c.category === cat)),
    [cards],
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorder(String(active.id), String(over.id))
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Le mie carte</h1>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setView('list')}
              aria-label="Vista elenco"
              aria-pressed={view === 'list'}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                view === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView('grid')}
              aria-label="Vista griglia"
              aria-pressed={view === 'grid'}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                view === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <Link to="/cards/new">
            <Button variant="secondary" className="!px-3">
              <Plus size={18} />
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative mb-3">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca una carta…"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {categoriesInUse.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              category === null ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Tutte
          </button>
          {categoriesInUse.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                category === cat ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {isError && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Impossibile caricare le carte. Controlla la connessione.
        </p>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={CreditCard}
          title={cards?.length ? 'Nessuna carta trovata' : 'Nessuna carta ancora'}
          description={
            cards?.length ? 'Prova a modificare la ricerca o il filtro.' : 'Scansiona la prima carta fedeltà per iniziare.'
          }
          action={
            !cards?.length && (
              <Link to="/scan">
                <Button>
                  <ScanLine size={18} />
                  Scansiona una carta
                </Button>
              </Link>
            )
          }
        />
      )}

      {filtered.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={filtered.map((c) => c.id)}
            strategy={view === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
          >
            <div className={view === 'grid' ? 'grid grid-cols-2 gap-3 pb-4' : 'flex flex-col gap-2 pb-4'}>
              {filtered.map((card) => (
                <SortableCard key={card.id} card={card} view={view} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
