import { makeFunctionReference } from 'convex/server'
import type { ProcessSnapshot } from '../data/processTypes'

export type StageStatus = 'DONE' | 'ACTIVE' | 'PENDING'

/** Lean live row from process.getLive */
export type LiveProcess = {
  stages: { id: string; label: string; status: StageStatus }[]
  counts: {
    rootFolders: number
    looseFiles: number
    proposeRows: number
    movesExecuted: number
    pendingHolds: number
  }
  pendingHoldIds: string[]
  lastSyncedAt: number
  stampLabel: string | null
  detail: Partial<ProcessSnapshot> | null
}

export const getLiveRef = makeFunctionReference<
  'query',
  Record<string, never>,
  LiveProcess | null
>('process:getLive')

/** Merge Convex live over embedded snapshot for offline-safe UI. */
export function mergeLive(
  embedded: ProcessSnapshot,
  live: LiveProcess | null | undefined,
): { snap: ProcessSnapshot; source: 'convex' | 'embedded'; lastSyncedAt: number | null } {
  if (!live) {
    return { snap: embedded, source: 'embedded', lastSyncedAt: null }
  }

  const d = (live.detail && typeof live.detail === 'object' ? live.detail : {}) as Partial<ProcessSnapshot>
  const base: ProcessSnapshot = {
    ...embedded,
    ...d,
    mara: { ...embedded.mara, ...(d.mara || {}) },
    cole: { ...embedded.cole, ...(d.cole || {}) },
    rina: { ...embedded.rina, ...(d.rina || {}) },
    vince: { ...embedded.vince, ...(d.vince || {}) },
    execute: { ...embedded.execute, ...(d.execute || {}) },
    locks: d.locks?.length ? d.locks : embedded.locks,
  }

  // strip internal _live stash if present
  if (base.mara && '_live' in (base.mara as object)) {
    const { _live: _, ...rest } = base.mara as ProcessSnapshot['mara'] & { _live?: unknown }
    base.mara = rest as ProcessSnapshot['mara']
  }

  const c = live.counts
  base.mara = {
    ...base.mara,
    rootFolders: c.rootFolders,
    looseFiles: c.looseFiles,
    looseFilesClaim: `≥${c.looseFiles}`,
    rootTotalClaimed: `≥${c.rootFolders + c.looseFiles}`,
    status: stageOf(live, 'mara') ?? base.mara.status,
  }
  base.cole = {
    ...base.cole,
    proposeRows: c.proposeRows,
    status: stageOf(live, 'cole') ?? base.cole.status,
  }
  base.rina = {
    ...base.rina,
    status: stageOf(live, 'rina') ?? base.rina.status,
  }

  const pendingIds = [...new Set(live.pendingHoldIds)]
  const pending = pendingIds.map((id) => {
    const existing =
      base.vince.pending?.find((p) => p.id === id) ||
      (d.vince?.pending ?? []).find((p) => p.id === id)
    return existing ?? { id, kind: 'HOLD', target: '?', why: 'pending' }
  })

  base.vince = {
    ...base.vince,
    pending,
    status: stageOf(live, 'vince') === 'DONE' ? 'DONE' : 'HOLDING',
  }
  base.execute = {
    ...base.execute,
    totalMoves: c.movesExecuted,
    pendingGates: pendingIds,
    status: stageOf(live, 'execute') === 'DONE' ? 'DONE' : base.execute.status || 'PARTIAL',
  }
  if (live.stampLabel) base.stampLabel = live.stampLabel
  if (live.lastSyncedAt) base.stamp = new Date(live.lastSyncedAt).toISOString()

  return { snap: base, source: 'convex', lastSyncedAt: live.lastSyncedAt }
}

function stageOf(live: LiveProcess, id: string): StageStatus | undefined {
  return live.stages.find((s) => s.id === id)?.status
}

export function litTargetFromSnap(snap: ProcessSnapshot): number {
  const statuses = [
    snap.mara.status,
    snap.cole.status,
    snap.rina.status,
    snap.vince.status,
    snap.execute.status,
  ]
  let n = 0
  for (const s of statuses) {
    const u = String(s).toUpperCase()
    if (u === 'DONE' || u === 'HOLDING' || u === 'PARTIAL' || u === 'ACTIVE') n += 1
    else break
  }
  return n
}

export function formatSyncedAgo(ts: number | null, now: number): string {
  if (!ts) return 'offline snap'
  const sec = Math.max(0, Math.floor((now - ts) / 1000))
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

export function formatCt(ts: number | null): string {
  if (!ts) return '—'
  return (
    new Date(ts).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' CT'
  )
}

export function tagClass(status: string): string {
  const u = status.toUpperCase()
  if (u === 'DONE') return 'done'
  if (u === 'HOLDING' || u === 'HOLD') return 'hold'
  if (u === 'PARTIAL' || u === 'ACTIVE') return 'partial'
  return 'hold'
}
