import { useCallback, useState } from 'react'
import { DendriteRing } from './components/DendriteRing'
import { GrokStub } from './components/GrokStub'
import { HudBar } from './components/HudBar'
import { InstallHint } from './components/InstallHint'
import { SortingDemo, type LedgerEntry } from './components/SortingDemo'
import { StagePanels } from './components/StagePanels'
import { useLiveMetrics } from './hooks/useLiveMetrics'
import { ALL_GAS } from './lib/config'
import type { Stage } from './lib/config'
import './App.css'

const EMPTY_COUNTS: Record<Stage, number> = {
  Intake: 0,
  Filter: 0,
  Evidence: 0,
  Verdict: 0,
  Store: 0,
}

export default function App() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [stageCounts, setStageCounts] = useState(EMPTY_COUNTS)
  const metrics = useLiveMetrics(5220 + ledger.length)

  const onSort = useCallback((entry: LedgerEntry) => {
    setLedger((prev) => [entry, ...prev].slice(0, 24))
    setStageCounts((prev) => ({
      Intake: prev.Intake + 1,
      Filter: prev.Filter + 1,
      Evidence: prev.Evidence + 1,
      Verdict: prev.Verdict + 1,
      Store: prev.Store + 1,
    }))
  }, [])

  return (
    <div className="app">
      <HudBar actions={metrics.actions} hits={metrics.hits} live />

      <main className="shell">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">// FLEET HUD</div>
            <h1>Sorting Machine</h1>
            <p>
              One law: claimed ≤ source on every line → bucket GRANT or REFUSE. Phone-first
              installable shell for the All Gas stack.
            </p>
            <div className="stack-chips">
              <span className="pill">CONVEX</span>
              <span className="pill">FIRECRAWL</span>
              <span className="pill">AGENTMAIL</span>
              <span className="pill">GROK stub</span>
            </div>
            <a
              className="card-chip"
              href={ALL_GAS.card}
              target="_blank"
              rel="noreferrer noopener"
            >
              Card → vibeapps.dev/s/ceilinggate-1
            </a>
          </div>
          <div className="hero-viz">
            <DendriteRing size={200} />
          </div>
        </section>

        <StagePanels
          pulse={metrics.stagePulse}
          metrics={metrics}
          stageCounts={stageCounts}
        />

        <SortingDemo ledger={ledger} onSort={onSort} />

        <div className="bottom-grid">
          <GrokStub />
          <InstallHint />
        </div>
      </main>

      <footer className="foot">
        <span>// prefer A · no redirect · HOLD FILE on vibeapps</span>
        <span>fleet-hud · offline-ready PWA</span>
      </footer>
    </div>
  )
}
