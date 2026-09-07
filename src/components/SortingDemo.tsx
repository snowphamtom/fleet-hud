import { useMemo, useState } from 'react'
import {
  buildDemoDriveFiberSort,
  buildFiberSort,
  buildNeverAgainBraidSort,
  fiberVerdict,
  loadPublicDriveSortSample,
  type FiberSort,
} from '../lib/fiber'
import { ALL_GAS } from '../lib/config'
import { pushDemoEvidence, runSortConvex } from '../lib/convexClient'
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
  /** Where the verdict came from when Convex is wired */
  source?: 'convex' | 'local'
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
  const [via, setVia] = useState<'convex' | 'local' | null>(null)
  const [busy, setBusy] = useState(false)
  const [evidenceMsg, setEvidenceMsg] = useState<string | null>(null)

  const preview = useMemo(() => {
    const c = parseNums(claimedRaw)
    const s = parseNums(sourceRaw)
    if (!c.length || !s.length) return null
    return sortClaim(c, s)
  }, [claimedRaw, sourceRaw])

  async function resolveSort(claimed: number[], source: number[]): Promise<{
    result: SortResult
    source: 'convex' | 'local'
  }> {
    if (ALL_GAS.convex.configured) {
      const remote = await runSortConvex(claimed, source)
      if (remote) return { result: remote, source: 'convex' }
    }
    return { result: sortClaim(claimed, source), source: 'local' }
  }

  async function run(label: string, claimed: number[], source: number[]) {
    setBusy(true)
    try {
      const { result, source: src } = await resolveSort(claimed, source)
      setClaimedRaw(claimed.join(', '))
      setSourceRaw(source.join(', '))
      setLast(result)
      setVia(src)
      onSort({
        id: makeId(),
        at: Date.now(),
        label: src === 'convex' ? `${label} · Convex` : label,
        verdict: result.verdict,
        result,
        fiber: buildFiberSort(claimed, source, { kind: 'demo', labelPrefix: 'L' }),
        source: src,
      })
    } finally {
      setBusy(false)
    }
  }

  function runCurrent() {
    const c = parseNums(claimedRaw)
    const s = parseNums(sourceRaw)
    if (!c.length || !s.length) return
    void run('Manual sort', c, s)
  }

  function runDriveWeb() {
    const fiber = buildDemoDriveFiberSort()
    const claimed = fiber.nodes.map((n) => n.claimed)
    const source = fiber.nodes.map((n) => n.source)
    const result = sortClaim(
      claimed.length ? claimed : [0],
      source.length ? source : [0],
    )
    const verdict = fiber.refuseIds.length ? 'REFUSE' : fiberVerdict(fiber)
    setClaimedRaw(claimed.slice(0, 8).join(', ') + (claimed.length > 8 ? ', …' : ''))
    setSourceRaw(source.slice(0, 8).join(', ') + (source.length > 8 ? ', …' : ''))
    setLast(result)
    setVia('local')
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
      source: 'local',
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
    setVia('local')
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
      source: 'local',
    })
  }

  async function runDriveJson() {
    const fiber = await loadPublicDriveSortSample('/data-test-sort-sample.json')
    if (!fiber) return
    const claimed = fiber.nodes.map((n) => n.claimed)
    const source = fiber.nodes.map((n) => n.source)
    const result = sortClaim(
      claimed.length ? claimed : [0],
      source.length ? source : [0],
    )
    const verdict = fiber.refuseIds.length ? 'REFUSE' : fiberVerdict(fiber)
    setClaimedRaw(claimed.slice(0, 6).join(', ') + (claimed.length > 6 ? ', …' : ''))
    setSourceRaw(source.slice(0, 6).join(', ') + (source.length > 6 ? ', …' : ''))
    setLast(result)
    setVia('local')
    onSort({
      id: makeId(),
      at: Date.now(),
      label: `Drive JSON · ${fiber.nodes.length} units · keep/watch/ignore`,
      verdict,
      result: {
        ...result,
        verdict,
        lines: fiber.nodes.slice(0, 48).map((n, i) => ({
          index: i,
          claimed: n.claimed,
          source: n.source,
          ok: n.claimed <= n.source,
          overage: Math.max(0, n.claimed - n.source),
        })),
      },
      fiber,
      source: 'local',
    })
  }

  async function onPushEvidence() {
    if (!ALL_GAS.convex.configured) {
      setEvidenceMsg('Convex offline')
      return
    }
    setBusy(true)
    setEvidenceMsg('Pushing…')
    try {
      const id = await pushDemoEvidence()
      setEvidenceMsg(id ? `Evidence ok · ${id.slice(0, 12)}…` : 'Push failed · soft')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="sorting-block">
      <SectionLabel title="TRY" value="C ≤ S" accent />
      <p className="try-hint">
        Tap Demo GRANT / REFUSE / Drive / Braid 7 — metrics → keep/watch/ignore
        {ALL_GAS.convex.configured ? ' · Convex live' : ' · local sort'}.
      </p>
      <div className="demo-row">
        <button
          type="button"
          className="btn grant grant-btn"
          disabled={busy}
          onClick={() => void run(DEMO_GRANT.label, DEMO_GRANT.claimed, DEMO_GRANT.source)}
        >
          Demo GRANT
        </button>
        <button
          type="button"
          className="btn refuse refuse-btn"
          disabled={busy}
          onClick={() => void run(DEMO_REFUSE.label, DEMO_REFUSE.claimed, DEMO_REFUSE.source)}
        >
          Demo REFUSE
        </button>
        <button type="button" className="btn primary" disabled={busy} onClick={runDriveWeb}>
          Demo Drive Sort
        </button>
        <button type="button" className="btn ghost" disabled={busy} onClick={() => void runDriveJson()}>
          Load Drive JSON
        </button>
        <button type="button" className="btn grant" disabled={busy} onClick={runBraid}>
          Demo Braid 7
        </button>
        {ALL_GAS.convex.configured ? (
          <button type="button" className="btn ghost" disabled={busy} onClick={() => void onPushEvidence()}>
            Push evidence
          </button>
        ) : null}
      </div>
      {evidenceMsg ? <p className="try-hint">{evidenceMsg}</p> : null}

      <article className="panel sort-shell">
        <SectionLabel
          title="SORTING MACHINE — LIVE"
          value={via === 'convex' ? 'Convex' : via === 'local' ? 'local' : undefined}
        />
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
              setVia(null)
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
              setVia(null)
            }}
          >
            Load REFUSE
          </button>
          <button type="button" className="btn primary" disabled={busy} onClick={runCurrent}>
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
                  {via ? ` · via ${via}` : ''}
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
                    {e.source ? ` · ${e.source}` : ''}
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
