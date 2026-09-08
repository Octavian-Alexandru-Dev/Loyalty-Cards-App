import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ScanLine, CreditCard } from 'lucide-react'
import { useCards } from './useCards'
import { CardListItem } from './CardListItem'
import { EmptyState } from '../components/EmptyState'
import { Spinner } from '../components/Spinner'
import { Button } from '../components/Button'
import { CARD_CATEGORIES } from '../types'

export default function CardsListPage() {
  const { data: cards, isLoading, isError } = useCards()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!cards) return []
    return cards.filter((c) => {
      const matchesSearch = c.label.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !category || c.category === category
      return matchesSearch && matchesCategory
    })
  }, [cards, search, category])

  const categoriesInUse = useMemo(
    () => CARD_CATEGORIES.filter((cat) => cards?.some((c) => c.category === cat)),
    [cards],
  )

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Le mie carte</h1>
        <Link to="/cards/new">
          <Button variant="secondary" className="!px-3">
            <Plus size={18} />
          </Button>
        </Link>
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

      <div className="flex flex-col gap-2">
        {filtered.map((card) => (
          <CardListItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}
