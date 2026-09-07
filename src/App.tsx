import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { ProcessRing, useRingLightUp, type StageId } from './components/ProcessRing'
import { InstallHint } from './components/InstallHint'
import { ALL_GAS } from './lib/config'
import {
  formatCt,
  formatSyncedAgo,
  getLatestRef,
  litTargetFromSnap,
  resolveSnap,
  tagClass,
} from './lib/processLive'
import snapJson from './data/processSnapshot.json'
import type { ProcessSnapshot } from './data/processTypes'
import './App.css'

const EMBEDDED = snapJson as ProcessSnapshot

function StageDetail({ id, snap }: { id: StageId; snap: ProcessSnapshot }) {
  if (id === 'mara') {
    const m = snap.mara
    return (
      <article className="detail" data-stage="mara">
        <header>
          <span className={`tag ${tagClass(m.status)}`}>{m.status}</span>
          <h2>MARA — Drive inventory</h2>
          <p className="role">
            {m.role} · {m.bot} · measured {m.measured}
          </p>
        </header>
        <div className="stat-grid">
          <div className="stat">
            <span className="stat-n">{m.rootFolders}</span>
            <span className="stat-l">root folders</span>
          </div>
          <div className="stat">
            <span className="stat-n">{m.looseFilesClaim}</span>
            <span className="stat-l">loose files</span>
          </div>
          <div className="stat">
            <span className="stat-n">{m.introOutroChildren}</span>
            <span className="stat-l">intro-outro kids</span>
          </div>
          <div className="stat">
            <span className="stat-n">{m.rootTotalClaimed}</span>
            <span className="stat-l">root claimed</span>
          </div>
        </div>
        <p className="note">Shelves 00–08 present · claimed ≤ interior · scan only</p>
        <div className="chips">{m.artifacts.map((a) => <span key={a}>{a}</span>)}</div>
      </article>
    )
  }
  if (id === 'cole') {
    const c = snap.cole
    return (
      <article className="detail" data-stage="cole">
        <header>
          <span className={`tag ${tagClass(c.status)}`}>{c.status}</span>
          <h2>COLE — PROPOSE pack</h2>
          <p className="role">
            {c.role} · {c.bot}
          </p>
        </header>
        <div className="stat-grid">
          <div className="stat highlight">
            <span className="stat-n">{c.proposeRows}</span>
            <span className="stat-l">rows in index.md</span>
          </div>
          <div className="stat">
            <span className="stat-n">{c.packA}</span>
            <span className="stat-l">Pack A optic</span>
          </div>
          <div className="stat">
            <span className="stat-n">{c.packB}</span>
            <span className="stat-l">Pack B → 07</span>
          </div>
          <div className="stat">
            <span className="stat-n">{c.packC}</span>
            <span className="stat-l">Pack C → 08</span>
          </div>
        </div>
        <p className="note">{c.law}</p>
        <div className="chips">{c.artifacts.map((a) => <span key={a}>{a}</span>)}</div>
      </article>
    )
  }
  if (id === 'rina') {
    const r = snap.rina
    return (
      <article className="detail" data-stage="rina">
        <header>
          <span className={`tag ${tagClass(r.status)}`}>{r.status}</span>
          <h2>RINA — plates / intro-outro</h2>
          <p className="role">
            {r.role} · {r.bot}
          </p>
        </header>
        <div className="stat-grid">
          <div className="stat highlight">
            <span className="stat-n">{r.introOutroIntact ? 'INTACT' : '—'}</span>
            <span className="stat-l">intro-outro</span>
          </div>
          <div className="stat">
            <span className="stat-n">{r.stayOptics}</span>
            <span className="stat-l">stay optics</span>
          </div>
          <div className="stat">
            <span className="stat-n">{r.propose07}</span>
            <span className="stat-l">propose → 07</span>
          </div>
        </div>
        <p className="note">
          {r.boundary} · id {r.introOutroId.slice(0, 12)}…
        </p>
        <div className="chips">{r.artifacts.map((a) => <span key={a}>{a}</span>)}</div>
      </article>
    )
  }
  if (id === 'vince') {
    const v = snap.vince
    return (
      <article className="detail" data-stage="vince">
        <header>
          <span className={`tag ${tagClass(v.status)}`}>{v.status}</span>
          <h2>VINCE — holds board</h2>
          <p className="role">
            {v.role} · {v.bot} · execute only {v.gate}
          </p>
        </header>
        <div className="hold-cols">
          <div>
            <h3>Executed</h3>
            <ul>
              {v.executed.map((e) => (
                <li key={e.id}>
                  <span className="kw done">DONE</span> {e.id} → {e.dest}
                  <em>{e.label}</em>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Pending</h3>
            <ul>
              {v.pending.map((p) => (
                <li key={p.id}>
                  <span className="kw pend">{p.kind}</span> {p.id}
                  <em>{p.why}</em>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="chips">{v.artifacts.map((a) => <span key={a}>{a}</span>)}</div>
      </article>
    )
  }
  const x = snap.execute
  return (
    <article className="detail" data-stage="execute">
      <header>
        <span className={`tag ${tagClass(x.status)}`}>{x.status}</span>
        <h2>EXECUTE — moves</h2>
        <p className="role">{x.when} · metadata parent moves only</p>
      </header>
      <div className="stat-grid">
        <div className="stat highlight">
          <span className="stat-n">{x.plates07.moved}→07</span>
          <span className="stat-l">plates-07 DONE</span>
        </div>
        <div className="stat highlight">
          <span className="stat-n">{x.archival08.moved}→08</span>
          <span className="stat-l">archival-08 DONE</span>
        </div>
        <div className="stat">
          <span className="stat-n">{x.totalMoves}</span>
          <span className="stat-l">total moves</span>
        </div>
        <div className="stat">
          <span className="stat-n">{x.totalFail}</span>
          <span className="stat-l">fail</span>
        </div>
      </div>
      <p className="note">
        archival-08 = named {x.archival08.breakdown.named} + IMG {x.archival08.breakdown.img} +
        UUID {x.archival08.breakdown.uuid} + misc {x.archival08.breakdown.misc}
      </p>
      <div className="pending-strip">
        <span>PENDING</span>
        {x.pendingGates.map((g) => (
          <code key={g}>{g}</code>
        ))}
      </div>
      <div className="chips">{x.artifacts.map((a) => <span key={a}>{a}</span>)}</div>
    </article>
  )
}

function LiveApp() {
  const live = useQuery(getLatestRef, ALL_GAS.convex.configured ? {} : 'skip')
  const { snap, source, lastSyncedAt } = useMemo(
    () => resolveSnap(EMBEDDED, live ?? null),
    [live],
  )
  const [active, setActive] = useState<StageId>('execute')
  const [now, setNow] = useState(() => Date.now())
  const [tickFlash, setTickFlash] = useState(0)
  const litTarget = litTargetFromSnap(snap)
  const litThrough = useRingLightUp(litTarget, 480, snap.stamp)
  const convexOk = ALL_GAS.convex.configured
  const pending = snap.vince.pending
  const loading = convexOk && live === undefined

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (lastSyncedAt) setTickFlash((n) => n + 1)
  }, [lastSyncedAt, snap.execute.totalMoves, snap.cole.proposeRows, pending.length])

  const pipeline = useMemo(
    () =>
      [
        { id: 'mara' as const, label: 'MARA', metric: `${snap.mara.rootFolders} folders` },
        { id: 'cole' as const, label: 'COLE', metric: `${snap.cole.proposeRows} propose` },
        { id: 'rina' as const, label: 'RINA', metric: 'intro-outro OK' },
        { id: 'vince' as const, label: 'VINCE', metric: `${pending.length} pending` },
        {
          id: 'execute' as const,
          label: 'EXECUTE',
          metric: `${snap.execute.totalMoves} moves`,
        },
      ] as const,
    [snap, pending.length],
  )

  const ago = formatSyncedAgo(lastSyncedAt, now)

  return (
    <div className={`app dark-hud ${tickFlash ? 'data-tick' : ''}`} data-tick={tickFlash}>
      <header className="topbar">
        <div className="brand">
          <span className={`pulse-dot ${source === 'convex' ? 'live' : ''}`} aria-hidden />
          <div>
            <div className="brand-kicker">// KLAUS DRIVE RING</div>
            <div className="brand-title">Fleet HUD · PROCESS</div>
          </div>
        </div>
        <div className="top-meta">
          <span className="pill">
            {loading ? 'CONVEX…' : convexOk && source === 'convex' ? 'CONVEX live' : 'CONVEX off'}
          </span>
          <span className="pill mute">{snap.stampLabel}</span>
          <span className="pill mute live-ago" key={ago}>
            {source === 'convex' ? `synced ${ago}` : 'bundled'}
          </span>
          {source === 'convex' && lastSyncedAt ? (
            <span className="pill mute">{formatCt(lastSyncedAt)}</span>
          ) : null}
        </div>
      </header>

      <main className="shell">
        <section className="hero">
          <div className="hero-copy">
            <h1>Drive process</h1>
            <p>
              Mara scan → Cole PROPOSE → Rina plates → Vince <code>approve[id]</code> gate →
              Execute. Live continuous ring{source === 'convex' ? ' · Convex subscribe' : ' · offline snap'}.
            </p>
            <div className="hero-nums">
              <div>
                <strong>{snap.mara.rootFolders}</strong>
                <span>root folders</span>
              </div>
              <div>
                <strong>{snap.cole.proposeRows}</strong>
                <span>propose rows</span>
              </div>
              <div>
                <strong>{snap.execute.totalMoves}</strong>
                <span>moves · {snap.execute.totalFail} fail</span>
              </div>
              <div>
                <strong>{pending.length}</strong>
                <span>gates open</span>
              </div>
            </div>
          </div>
          <div className="hero-viz">
            <ProcessRing
              snap={snap}
              active={active}
              onSelect={setActive}
              litThrough={litThrough}
            />
          </div>
        </section>

        <nav className="pipeline" aria-label="Process stages">
          {pipeline.map((s, i) => {
            const lit = i < litThrough
            return (
              <button
                key={s.id}
                type="button"
                className={`pipe-stage ${active === s.id ? 'active' : ''} ${lit ? 'lit' : ''}`}
                onClick={() => setActive(s.id)}
              >
                <span className="pipe-idx">{String(i + 1).padStart(2, '0')}</span>
                <span className="pipe-label">{s.label}</span>
                <span className="pipe-metric">{s.metric}</span>
              </button>
            )
          })}
        </nav>

        <StageDetail id={active} snap={snap} />

        <section className="locks panel">
          <div className="section-label">
            <span className="section-title">// PENDING HOLDS</span>
            <span className="section-value">{pending.length} open</span>
          </div>
          <div className="lock-row">
            {pending.map((p) => (
              <span key={p.id} className="lock-chip">
                {p.kind} · {p.id}
              </span>
            ))}
            {pending.length === 0 ? <span className="lock-chip">none</span> : null}
          </div>
        </section>

        <section className="locks panel">
          <div className="section-label">
            <span className="section-title">// LOCKS</span>
            <span className="section-value">fail-closed</span>
          </div>
          <div className="lock-row">
            {snap.locks.map((l) => (
              <span key={l} className="lock-chip">
                {l}
              </span>
            ))}
          </div>
        </section>

        <section className="board panel">
          <div className="section-label">
            <span className="section-title">// EXECUTE SUMMARY</span>
            <span className="section-value">
              {snap.execute.totalMoves} OK · {snap.execute.totalFail} fail
            </span>
          </div>
          <div className="board-grid">
            <div className="board-card done">
              <span className="bc-k">plates-07</span>
              <span className="bc-v">{snap.execute.plates07.moved} → 07</span>
              <span className="bc-s">MTP · FIG · GRIMM keep · cover</span>
            </div>
            <div className="board-card done">
              <span className="bc-k">archival-08</span>
              <span className="bc-v">{snap.execute.archival08.moved} → 08</span>
              <span className="bc-s">glass dups · IMG wave · UUID PNGs</span>
            </div>
            {pending.map((p) => (
              <div className="board-card pend" key={p.id}>
                <span className="bc-k">{p.id}</span>
                <span className="bc-v">{p.kind}</span>
                <span className="bc-s">{p.why}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="bottom-grid">
          <article className="panel wire">
            <div className="section-label">
              <span className="section-title">// WIRE</span>
            </div>
            <ul className="wire-list">
              <li>
                <span>Convex</span>
                <code>{convexOk ? 'fleet-gerbil-682' : 'unconfigured'}</code>
              </li>
              <li>
                <span>Drive</span>
                <code>{snap.drive}</code>
              </li>
              <li>
                <span>Snapshot</span>
                <code>{source === 'convex' ? 'processRing:getLatest' : 'embedded JSON'}</code>
              </li>
              <li>
                <span>Ring</span>
                <code>{snap.ring}</code>
              </li>
            </ul>
          </article>
          <InstallHint />
        </div>
      </main>

      <footer className="foot">
        <span>// dark forensic · live continuous · claimed ≤ interior</span>
        <span>snowphamtom/fleet-hud · PWA</span>
      </footer>
    </div>
  )
}

/** When ConvexProvider is absent, useQuery is unavailable — wrap safely. */
export default function App() {
  if (!ALL_GAS.convex.configured) {
    return <OfflineApp />
  }
  return <LiveApp />
}

function OfflineApp() {
  const snap = EMBEDDED
  const [active, setActive] = useState<StageId>('execute')
  const litThrough = useRingLightUp(5, 480, snap.stamp)
  return (
    <div className="app dark-hud">
      <header className="topbar">
        <div className="brand">
          <span className="pulse-dot" aria-hidden />
          <div>
            <div className="brand-kicker">// KLAUS DRIVE RING</div>
            <div className="brand-title">Fleet HUD · PROCESS</div>
          </div>
        </div>
        <div className="top-meta">
          <span className="pill">CONVEX off</span>
          <span className="pill mute">{snap.stampLabel}</span>
        </div>
      </header>
      <main className="shell">
        <section className="hero">
          <div className="hero-copy">
            <h1>Drive process</h1>
            <p>Offline bundled snapshot.</p>
          </div>
          <div className="hero-viz">
            <ProcessRing snap={snap} active={active} onSelect={setActive} litThrough={litThrough} />
          </div>
        </section>
        <StageDetail id={active} snap={snap} />
      </main>
    </div>
  )
}
