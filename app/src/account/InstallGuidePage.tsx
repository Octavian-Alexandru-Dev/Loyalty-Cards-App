import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Share, MoreVertical, Monitor, TriangleAlert } from 'lucide-react'

export default function InstallGuidePage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-8">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Indietro">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Installa l'app</h1>
      </div>

      <p className="mb-5 text-sm text-slate-500">
        Salvando l'app sulla schermata Home del telefono si apre a schermo intero, senza la barra
        del browser, come un'app normale — e funziona anche offline per le carte già salvate.
      </p>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-lg">
            📱
          </span>
          <p className="font-medium text-slate-900">iPhone e iPad</p>
        </div>

        <div className="mb-3 flex gap-2 rounded-xl bg-amber-50 p-3">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800">
            Funziona solo aprendo l'app con <strong>Safari</strong>. Chrome, Firefox o altri browser
            su iPhone/iPad non possono aggiungere l'app alla schermata Home: è una limitazione di
            iOS, non dell'app.
          </p>
        </div>

        <ol className="flex flex-col gap-3 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <Step n={1} />
            <span>Apri questo sito in Safari (se non lo è già).</span>
          </li>
          <li className="flex items-start gap-3">
            <Step n={2} />
            <span className="flex items-center gap-1.5 flex-wrap">
              Tocca l'icona <Share size={16} className="inline text-brand-600" /> <strong>Condividi</strong>{' '}
              nella barra in basso (su iPad è in alto).
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Step n={3} />
            <span>
              Scorri il menu che si apre e tocca <strong>"Aggiungi alla schermata Home"</strong>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Step n={4} />
            <span>
              Tocca <strong>"Aggiungi"</strong> in alto a destra.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Step n={5} />
            <span>Trovi l'icona dell'app sulla schermata Home: aprila da lì.</span>
          </li>
        </ol>
      </section>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-lg">
            🤖
          </span>
          <p className="font-medium text-slate-900">Android</p>
        </div>

        <ol className="flex flex-col gap-3 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <Step n={1} />
            <span>Apri questo sito in Chrome (o un altro browser basato su Chromium).</span>
          </li>
          <li className="flex items-start gap-3">
            <Step n={2} />
            <span>
              Se compare un banner <strong>"Aggiungi a schermata Home"</strong> o{' '}
              <strong>"Installa app"</strong> in basso, toccalo e conferma. Altrimenti continua al
              passo successivo.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Step n={3} />
            <span className="flex items-center gap-1.5 flex-wrap">
              Tocca i tre puntini <MoreVertical size={16} className="inline text-brand-600" /> in alto
              a destra.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Step n={4} />
            <span>
              Tocca <strong>"Aggiungi a schermata Home"</strong> o <strong>"Installa app"</strong> e
              conferma.
            </span>
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Monitor size={22} className="text-slate-700" />
          <p className="font-medium text-slate-900">Computer (Chrome / Edge)</p>
        </div>

        <ol className="flex flex-col gap-3 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <Step n={1} />
            <span>Apri questo sito nel browser.</span>
          </li>
          <li className="flex items-start gap-3">
            <Step n={2} />
            <span>
              Cerca l'icona di installazione (di solito un piccolo schermo con una freccia) nella
              barra degli indirizzi, sulla destra.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Step n={3} />
            <span>
              Clicca e conferma <strong>"Installa"</strong>. L'app si apre in una finestra propria,
              richiamabile dal menu Start / Launchpad.
            </span>
          </li>
        </ol>
      </section>
    </div>
  )
}

function Step({ n }: { n: number }) {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
      {n}
    </span>
  )
}
