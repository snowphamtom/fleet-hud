import { useMemo, useState } from 'react'
import {
  buildDemoDriveFiberSort,
  buildFiberSort,
  buildNeverAgainBraidSort,
  fiberVerdict,
  type FiberSort,
} from '../lib/fiber'
import {
  DEMO_GRANT,
  DEMO_REFUSE,
  parseNums,
  sortClaim,
  type SortResult,
  type Verdict,
} from '../lib/sort'
import { SectionLabel } from './SectionLabel'

export type LedgerEntry = {
  id: string
  at: number
  label: string
  verdict: Verdict
  result: SortResult
  /** Numbers-first spider web — drives torus clusters / fiber edges */
  fiber: FiberSort
}

type Props = {
  ledger: LedgerEntry[]
  onSort: (entry: LedgerEntry) => void
}

function makeId() {
  return `L-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function SortingDemo({ ledger, onSort }: Props) {
  const [claimedRaw, setClaimedRaw] = useState(DEMO_GRANT.claimed.join(', '))
  const [sourceRaw, setSourceRaw] = useState(DEMO_GRANT.source.join(', '))
  const [last, setLast] = useState<SortResult | null>(null)

  const preview = useMemo(() => {
    const c = parseNums(claimedRaw)
    const s = parseNums(sourceRaw)
    if (!c.length || !s.length) return null
    return sortClaim(c, s)
  }, [claimedRaw, sourceRaw])

  function run(label: string, claimed: number[], source: number[]) {
    const result = sortClaim(claimed, source)
    setClaimedRaw(claimed.join(', '))
    setSourceRaw(source.join(', '))
    setLast(result)
    onSort({
      id: makeId(),
      at: Date.now(),
      label,
      verdict: result.verdict,
      result,
      fiber: buildFiberSort(claimed, source, { kind: 'demo', labelPrefix: 'L' }),
    })
  }

  function runCurrent() {
    const c = parseNums(claimedRaw)
    const s = parseNums(sourceRaw)
    if (!c.length || !s.length) return
    run('Manual sort', c, s)
  }

  function runDriveWeb() {
    const fiber = buildDemoDriveFiberSort()
    const claimed = fiber.nodes.map((n) => n.claimed)
    const source = fiber.nodes.map((n) => n.source)
    const result = sortClaim(
      claimed.length ? claimed : [0],
      source.length ? source : [0],
    )
    // Prefer Drive metrics verdict from buckets
    const verdict = fiber.refuseIds.length ? 'REFUSE' : fiberVerdict(fiber)
    setClaimedRaw(claimed.slice(0, 8).join(', ') + (claimed.length > 8 ? ', …' : ''))
    setSourceRaw(source.slice(0, 8).join(', ') + (source.length > 8 ? ', …' : ''))
    setLast(result)
    onSort({
      id: makeId(),
      at: Date.now(),
      label: `Demo Drive Sort · ${fiber.nodes.length} units`,
      verdict,
      result: { ...result, verdict, lines: fiber.nodes.map((n, i) => ({
        index: i,
        claimed: n.claimed,
        source: n.source,
        ok: n.claimed <= n.source,
        overage: Math.max(0, n.claimed - n.source),
      })) },
      fiber,
    })
  }
  function runBraid() {
    const fiber = buildNeverAgainBraidSort()
    const claimed = fiber.nodes.map((n) => n.claimed)
    const source = fiber.nodes.map((n) => n.source)
    const result = sortClaim(claimed, source)
    const verdict = fiber.refuseIds.length ? 'REFUSE' : fiberVerdict(fiber)
    setClaimedRaw(claimed.slice(0, 8).join(', ') + ', …')
    setSourceRaw(source.slice(0, 8).join(', ') + ', …')
    setLast(result)
    onSort({
      id: makeId(),
      at: Date.now(),
      label: `Never Again braid · 7 strands · ${fiber.nodes.length} units`,
      verdict,
      result: {
        ...result,
        verdict,
        lines: fiber.nodes.map((n, i) => ({
          index: i,
          claimed: n.claimed,
          source: n.source,
          ok: n.claimed <= n.source,
          overage: Math.max(0, n.claimed - n.source),
        })),
      },
      fiber,
    })
  }


  return (
    <section className="sorting-block">
      <SectionLabel title="TRY" value="C ≤ S" accent />
      <p className="try-hint">Tap Demo GRANT / REFUSE / Drive / Braid 7 (Never Again → C≤S) — metrics → keep/watch/ignore.</p>
      <div className="demo-row">
        <button
          type="button"
          className="btn grant grant-btn"
          onClick={() => run(DEMO_GRANT.label, DEMO_GRANT.claimed, DEMO_GRANT.source)}
        >
          Demo GRANT
        </button>
        <button
          type="button"
          className="btn refuse refuse-btn"
          onClick={() => run(DEMO_REFUSE.label, DEMO_REFUSE.claimed, DEMO_REFUSE.source)}
        >
          Demo REFUSE
        </button>
        <button type="button" className="btn primary" onClick={runDriveWeb}>
          Demo Drive Sort
        </button>
        <button type="button" className="btn grant" onClick={runBraid}>
          Demo Braid 7
        </button>
      </div>

      <article className="panel sort-shell">
        <SectionLabel title="SORTING MACHINE — LIVE" />
        <div className="stage-crumb">
          // 1. Intake · 2. Filter · 3. Evidence · 4. Verdict · 5. Store
        </div>
        <label className="field">
          <span>Claimed (C)</span>
          <input
            value={claimedRaw}
            onChange={(e) => setClaimedRaw(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Source / on-receipt (S)</span>
          <input
            value={sourceRaw}
            onChange={(e) => setSourceRaw(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
          />
        </label>
        <div className="demo-row compact">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setClaimedRaw(DEMO_GRANT.claimed.join(', '))
              setSourceRaw(DEMO_GRANT.source.join(', '))
              setLast(null)
            }}
          >
            Load GRANT
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setClaimedRaw(DEMO_REFUSE.claimed.join(', '))
              setSourceRaw(DEMO_REFUSE.source.join(', '))
              setLast(null)
            }}
          >
            Load REFUSE
          </button>
          <button type="button" className="btn primary" onClick={runCurrent}>
            SORT C ≤ S
          </button>
        </div>

        {(last ?? preview) && (
          <div className="line-preview">
            {(last ?? preview)!.lines.map((line) => (
              <div key={line.index} className={`line-chip ${line.ok ? 'ok' : 'bad'}`}>
                <span>
                  L{line.index + 1} C={line.claimed} S={line.source}
                </span>
                <b>{line.ok ? 'C≤S' : `+${line.overage}`}</b>
              </div>
            ))}
            {(() => {
              const src = last ?? preview
              if (!src) return null
              const fiber = buildFiberSort(src.claimed, src.source, { kind: 'demo' })
              return (
                <div className="fiber-meta panel-foot">
                  fiber · G={fiber.grantIds.length} R={fiber.refuseIds.length} ·{' '}
                  {fiber.edges.length} edges (residual)
                </div>
              )
            })()}
          </div>
        )}
      </article>

      <article className="panel ledger-panel">
        <SectionLabel title="LEDGER" value={ledger.length} />
        {ledger.length === 0 ? (
          <div className="awaiting">AWAITING LEDGER — tap Demo GRANT / REFUSE / Drive Sort</div>
        ) : (
          <ul className="ledger">
            {ledger.map((e) => (
              <li key={e.id} className={`ledger-item ${e.verdict.toLowerCase()}`}>
                <div className="ledger-main">
                  <strong>{e.label}</strong>
                  <span className="ledger-meta">
                    {new Date(e.at).toLocaleTimeString()} · {e.result.lines.length} lines
                  </span>
                  <div className="chip-row">
                    {e.result.lines.map((line) => (
                      <span
                        key={line.index}
                        className={`cs-chip ${line.ok ? 'ok' : 'bad'}`}
                        title={`C=${line.claimed} S=${line.source}`}
                      >
                        {line.ok ? 'C≤S' : 'C>S'}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`stamp verdict-stamp ${e.verdict.toLowerCase()}`}>{e.verdict}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  )
}
