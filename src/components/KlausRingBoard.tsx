import { useMemo, useState } from 'react'
import processSnapshot from '../data/processSnapshot.json'
import type { ProcessSnapshot } from '../data/processTypes'
import { ProcessRing, STAGES, useRingLightUp, type StageId } from './ProcessRing'
import { SectionLabel } from './SectionLabel'

const snap = processSnapshot as ProcessSnapshot

function StageDetail({ id, data }: { id: StageId; data: ProcessSnapshot }) {
  if (id === 'mara') {
    const m = data.mara
    return (
      <div className="kring-detail">
        <h3>Intake / map · Mara</h3>
        <p className="muted">{m.status} · {m.bot} · {m.measured}</p>
        <ul>
          <li>Root folders: {m.rootFolders}</li>
          <li>Loose files: {m.looseFilesClaim}</li>
          <li>intro-outro children: {m.introOutroChildren}</li>
          <li>Shelves: {m.shelves.join(' · ')}</li>
          <li>Artifacts: {m.artifacts.join(', ')}</li>
        </ul>
      </div>
    )
  }
  if (id === 'cole') {
    const c = data.cole
    return (
      <div className="kring-detail">
        <h3>PROPOSE · Cole</h3>
        <p className="muted">{c.status} · {c.bot}</p>
        <ul>
          <li>PROPOSE rows: {c.proposeRows} (A{c.packA} · B{c.packB} · C{c.packC})</li>
          <li>{c.law}</li>
          <li>Artifacts: {c.artifacts.join(', ')}</li>
        </ul>
      </div>
    )
  }
  if (id === 'rina') {
    const r = data.rina
    return (
      <div className="kring-detail">
        <h3>Plates · Rina</h3>
        <p className="muted">{r.status} · {r.bot}</p>
        <ul>
          <li>intro-outro intact: {r.introOutroIntact ? 'yes' : 'no'}</li>
          <li>Stay optics: {r.stayOptics} · Propose→07: {r.propose07}</li>
          <li>{r.boundary}</li>
          <li>Artifacts: {r.artifacts.join(', ')}</li>
        </ul>
      </div>
    )
  }
  if (id === 'vince') {
    const v = data.vince
    return (
      <div className="kring-detail">
        <h3>Holds · Vince</h3>
        <p className="muted">{v.status} · gate {v.gate}</p>
        <ul>
          {v.pending.map((p) => (
            <li key={p.id}>
              {p.id} · {p.kind} · {p.target} — {p.why}
            </li>
          ))}
          {v.pending.length === 0 ? <li>No pending holds</li> : null}
        </ul>
      </div>
    )
  }
  const e = data.execute
  return (
    <div className="kring-detail">
      <h3>Executed · moves</h3>
      <p className="muted">{e.status} · {e.when}</p>
      <ul>
        <li>plates→07: {e.plates07.moved} moved · fail {e.plates07.fail}</li>
        <li>archival→08: {e.archival08.moved} moved · fail {e.archival08.fail}</li>
        <li>Total: {e.totalMoves} · fail {e.totalFail}</li>
        <li>Pending gates: {e.pendingGates.join(', ') || '—'}</li>
      </ul>
    </div>
  )
}

/** Klaus Drive ring — structure only (snapshot). No Convex. */
export function KlausRingBoard() {
  const [active, setActive] = useState<StageId>('mara')
  const litThrough = useRingLightUp(5, 480)
  const locks = useMemo(() => snap.locks, [])

  return (
    <section className="kring" id="klaus-ring" aria-label="Klaus Drive ring">
      <SectionLabel title="KLAUS DRIVE RING" value={snap.stampLabel} accent />
      <p className="try-hint">
        Five stages: Intake/map → PROPOSE → plates → holds → executed · snapshot only · no Drive mutate
      </p>
      <div className="kring-grid">
        <ProcessRing snap={snap} active={active} onSelect={setActive} litThrough={litThrough} />
        <article className="panel kring-panel">
          <ol className="kring-crumb" aria-label="Ring stages">
            {STAGES.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`kring-crumb-btn ${active === s.id ? 'on' : ''} ${i < litThrough ? 'lit' : ''}`}
                  onClick={() => setActive(s.id)}
                >
                  {i + 1}. {s.label}
                </button>
              </li>
            ))}
          </ol>
          <StageDetail id={active} data={snap} />
          <div className="kring-locks">
            {locks.map((L) => (
              <span key={L} className="pill">
                {L}
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
