import { makeFunctionReference } from 'convex/server'
import type { ProcessSnapshot } from '../data/processTypes'

/** Full live doc from processRing.getLatest */
export type LiveRingDoc = {
  _id?: string
  _creationTime?: number
  stamp: string
  stampLabel: string
  ring: string
  drive: string
  mara: ProcessSnapshot['mara']
  cole: ProcessSnapshot['cole']
  rina: ProcessSnapshot['rina']
  vince: ProcessSnapshot['vince']
  execute: ProcessSnapshot['execute']
  pendingHolds: { id: string; kind: string; target: string; why: string }[]
  locks: string[]
  updatedAt: number
}

export const getLatestRef = makeFunctionReference<
  'query',
  Record<string, never>,
  LiveRingDoc | null
>('processRing:getLatest')

/** @deprecated alias — HUD uses getLatestRef */
export const getLiveRef = getLatestRef

/** Prefer live Convex doc; fall back to embedded processSnapshot.json. */
export function resolveSnap(
  embedded: ProcessSnapshot,
  live: LiveRingDoc | null | undefined,
): { snap: ProcessSnapshot; source: 'convex' | 'embedded'; lastSyncedAt: number | null } {
  if (!live || !live.stamp) {
    return { snap: embedded, source: 'embedded', lastSyncedAt: null }
  }
  const pending =
    live.pendingHolds?.length > 0
      ? live.pendingHolds
      : live.vince?.pending ?? embedded.vince.pending

  const snap: ProcessSnapshot = {
    stamp: live.stamp || embedded.stamp,
    stampLabel: live.stampLabel || embedded.stampLabel,
    ring: live.ring || embedded.ring,
    drive: live.drive || embedded.drive,
    mara: { ...embedded.mara, ...(live.mara || {}) },
    cole: { ...embedded.cole, ...(live.cole || {}) },
    rina: { ...embedded.rina, ...(live.rina || {}) },
    vince: {
      ...embedded.vince,
      ...(live.vince || {}),
      pending,
    },
    execute: {
      ...embedded.execute,
      ...(live.execute || {}),
      pendingGates: pending.map((p) => p.id),
    },
    locks: live.locks?.length ? live.locks : embedded.locks,
  }
  return { snap, source: 'convex', lastSyncedAt: live.updatedAt ?? null }
}

/** Back-compat name used by App.tsx */
export function mergeLive(
  embedded: ProcessSnapshot,
  live: LiveRingDoc | null | undefined,
) {
  return resolveSnap(embedded, live)
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
