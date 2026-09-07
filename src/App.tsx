import { useCallback, useState } from 'react'
import type { FiberNode, FiberSort } from './lib/fiber'
import type { Verdict } from './lib/sort'
import { DendriteRing } from './components/DendriteRing'
import { FiberEvidence } from './components/FiberEvidence'
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

const ACCESS = [
  { name: 'mail', pct: 86 },
  { name: 'calendar', pct: 62 },
  { name: 'drive', pct: 74 },
  { name: 'contacts', pct: 41 },
  { name: 'billing', pct: 28 },
] as const

const BOTS = [
  { name: 'SCOUT', state: 'run' as const },
  { name: 'PATCH', state: 'run' as const },
  { name: 'PROXY', state: 'run' as const },
  { name: 'CLOSE', state: 'idle' as const },
  { name: 'DROP', state: 'idle' as const },
  { name: 'BELL', state: 'idle' as const },
]

const RUN_SEED = [
  { t: 'init: fork subdevice', kw: 'new', n: '01' },
  { t: 'auth: remote added', kw: 'granted', n: '02' },
  { t: 'action: follow-up', kw: 'new', n: '03' },
  { t: 'event: grant init', kw: 'granted', n: '04' },
  { t: 'trace: prefer-live', kw: 'new', n: '05' },
] as const

export default function App() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [stageCounts, setStageCounts] = useState(EMPTY_COUNTS)
  const [sortViz, setSortViz] = useState<{
    key: number
    fiber: FiberSort
    verdict: Verdict
  } | null>(null)
  const [fiberEvidence, setFiberEvidence] = useState<FiberNode | null>(null)
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
    // Drive torus node scramble → GRANT/REFUSE cluster migration
    setSortViz({
      key: Date.now(),
      fiber: entry.fiber,
      verdict: entry.verdict,
    })
    setFiberEvidence(null)
  }, [])

  const lastVerdict = ledger[0]?.verdict ?? sortViz?.verdict ?? null

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
              <span className="pill">{ALL_GAS.convex.configured ? 'CONVEX live' : 'CONVEX'}</span>
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
            <span className="hero-float a">SUBNET_004</span>
            <span className="hero-float b">ACTIVE_CORE</span>
            <span className="hero-float c">TRACE_002</span>
            <DendriteRing
              size={292}
              sortKey={sortViz?.key ?? 0}
              fiberSort={sortViz?.fiber ?? null}
              verdict={sortViz?.verdict ?? null}
              onFiberClick={(node) => setFiberEvidence(node)}
            />
            <FiberEvidence
              node={fiberEvidence}
              onClose={() => setFiberEvidence(null)}
            />
          </div>
        </section>

        {/* FUI modular status chrome — client demo only */}
        <section className="fleet-modules" aria-label="Fleet status modules">
          <article className="panel">
            <div className="section-label">
              <span className="section-title">// RUN LOG</span>
              <span className="section-value">{metrics.actions.toLocaleString()}</span>
            </div>
            <ul className="run-log">
              {RUN_SEED.map((row) => (
                <li key={row.n}>
                  <span>
                    <span className={`kw ${row.kw === 'granted' ? 'grant' : 'new'}`}>{row.kw}</span>{' '}
                    {row.t}
                  </span>
                  <span className="n">{row.n}</span>
                </li>
              ))}
              {ledger.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <span>
                    <span className={`kw ${e.verdict === 'GRANT' ? 'grant' : ''}`}>
                      {e.verdict.toLowerCase()}
                    </span>{' '}
                    {e.label.slice(0, 28)}
                  </span>
                  <span className="n">{e.result.lines.length}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="section-label">
              <span className="section-title">// ACCESS LEDGER</span>
            </div>
            <div className="access-rows">
              {ACCESS.map((row) => (
                <div key={row.name} className="access-row">
                  <span>{row.name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="panel-foot">6 days reachable from one login</div>
          </article>

          <article className="panel">
            <div className="section-label">
              <span className="section-title">// BLAST RADIUS</span>
            </div>
            <div className="blast">
              <div className="blast-gauge" aria-hidden>
                <span className="blast-num">3</span>
              </div>
              <div className="blast-copy">
                any stuck machine stops every bot · entering a bot leaves the session
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="section-label">
              <span className="section-title">// ACTION HEAT</span>
            </div>
            <div className="heat-grid" aria-hidden>
              {Array.from({ length: 128 }, (_, i) => {
                const base = metrics.heat[i % metrics.heat.length] ?? 0.2
                // right-side heat cluster (GitHub-style recent activity)
                const col = i % 16
                const boost =
                  col >= 12 ? 0.42 + (col - 12) * 0.12 : col >= 8 ? 0.12 : col >= 5 ? 0.02 : -0.14
                const v = Math.min(1, Math.max(0.05, base * 0.5 + boost + ((i * 17) % 9) * 0.025))
                const cool = v < 0.2
                return (
                  <span
                    key={i}
                    style={{
                      background: cool
                        ? `rgba(10,22,44,${0.06 + v * 0.14})`
                        : `linear-gradient(135deg, rgba(0,212,255,${0.28 + v * 0.72}), rgba(138,61,255,${0.16 + v * 0.62}))`,
                      boxShadow: cool ? undefined : '0 0 4px rgba(0,212,255,0.18)',
                    }}
                  />
                )
              })}
            </div>
          </article>

          <article className="panel">
            <div className="section-label">
              <span className="section-title">// THROUGHPUT</span>
              <span className="section-value">{metrics.throughput}/s</span>
            </div>
            <div className="thru-bars" aria-hidden>
              {Array.from({ length: 36 }, (_, i) => {
                const v = metrics.bars[i % metrics.bars.length] ?? 0.4
                const jag = 0.5 + 0.5 * Math.sin(i * 1.55) * Math.cos(i * 0.62)
                const h = Math.min(1, Math.max(0.1, v * jag))
                return <span key={i} style={{ height: `${Math.round(h * 100)}%` }} />
              })}
            </div>
            <div className="thru-pulse" aria-hidden />
            <div className="panel-foot">
              route health {metrics.routeHealth}% · // trace sync
            </div>
          </article>
          <article className="panel">
            <div className="section-label">
              <span className="section-title">// BOT STATUS</span>
              <span className="section-value">3/6</span>
            </div>
            <ul className="bot-list">
              {BOTS.map((b) => (
                <li key={b.name} className={`bot-row ${b.state}`}>
                  <span className="name">{b.name}</span>
                  <span className="bot-segs" aria-hidden>
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="bot-state">{b.state}</span>
                </li>
              ))}
            </ul>
          </article>

        </section>

        <StagePanels
          pulse={metrics.stagePulse}
          metrics={metrics}
          stageCounts={stageCounts}
          fiberSort={sortViz?.fiber ?? null}
        />

        <SortingDemo ledger={ledger} onSort={onSort} />

        <div className="result-strip" aria-live="polite">
          <span>// RESULT STAMP</span>
          {lastVerdict ? (
            <span className={`stamp ${lastVerdict.toLowerCase()}`}>{lastVerdict}</span>
          ) : (
            <span>awaiting Demo GRANT / REFUSE</span>
          )}
        </div>

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
