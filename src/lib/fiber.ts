/** Spider-web fiber sort model — numbers drive positions/colors, not costume labels. */

import type { LineDelta, SortResult, Verdict } from './sort'

export type FiberKind = 'line' | 'receipt' | 'drive' | 'demo'

export type FiberNode = {
  id: string
  label: string
  claimed: number // C
  source: number // S
  kind: FiberKind
}

export type FiberEdge = {
  from: string
  to: string
  /** claimed − source (of `from`); >0 = overage mass on the edge */
  residual: number
}

export type FiberSort = {
  nodes: FiberNode[]
  edges: FiberEdge[]
  grantIds: string[] // C ≤ S
  refuseIds: string[] // C > S
}

export function residualOf(n: Pick<FiberNode, 'claimed' | 'source'>): number {
  return n.claimed - n.source
}

export function isGrantNode(n: Pick<FiberNode, 'claimed' | 'source'>): boolean {
  return n.claimed <= n.source
}

export function fiberVerdict(fs: FiberSort): Verdict {
  if (fs.nodes.length === 0) return 'REFUSE'
  return fs.refuseIds.length === 0 ? 'GRANT' : 'REFUSE'
}

/** Ring + chords within GRANT and REFUSE clusters (data residual on each edge). */
function weaveEdges(nodes: FiberNode[], grantIds: string[], refuseIds: string[]): FiberEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const edges: FiberEdge[] = []
  const seen = new Set<string>()

  const push = (from: string, to: string) => {
    if (from === to) return
    const key = from < to ? `${from}|${to}` : `${to}|${from}`
    if (seen.has(key)) return
    seen.add(key)
    const n = byId.get(from)
    if (!n) return
    edges.push({ from, to, residual: residualOf(n) })
  }

  const ring = (ids: string[]) => {
    if (ids.length < 2) return
    for (let i = 0; i < ids.length; i++) {
      push(ids[i], ids[(i + 1) % ids.length])
      if (ids.length >= 4) push(ids[i], ids[(i + 2) % ids.length])
    }
  }

  ring(grantIds)
  ring(refuseIds)
  return edges
}

export function sealFiberSort(nodes: FiberNode[]): FiberSort {
  const grantIds: string[] = []
  const refuseIds: string[] = []
  for (const n of nodes) {
    if (isGrantNode(n)) grantIds.push(n.id)
    else refuseIds.push(n.id)
  }
  return { nodes, edges: weaveEdges(nodes, grantIds, refuseIds), grantIds, refuseIds }
}

/** Build FiberSort from parallel C/S arrays (Demo GRANT / REFUSE / manual). */
export function buildFiberSort(
  claimed: number[],
  source: number[],
  opts?: { kind?: FiberKind; labelPrefix?: string },
): FiberSort {
  const kind = opts?.kind ?? 'demo'
  const prefix = opts?.labelPrefix ?? 'L'
  const n = Math.max(claimed.length, source.length)
  const nodes: FiberNode[] = []
  for (let i = 0; i < n; i++) {
    const c = claimed[i] ?? 0
    const s = source[i] ?? 0
    nodes.push({
      id: `${kind}-${i}`,
      label: `${prefix}${i + 1}`,
      claimed: c,
      source: s,
      kind,
    })
  }
  return sealFiberSort(nodes)
}

export function fiberSortFromLines(lines: LineDelta[], kind: FiberKind = 'line'): FiberSort {
  return sealFiberSort(
    lines.map((l) => ({
      id: `${kind}-${l.index}`,
      label: `L${l.index + 1}`,
      claimed: l.claimed,
      source: l.source,
      kind,
    })),
  )
}

export function fiberSortFromResult(result: SortResult, kind: FiberKind = 'demo'): FiberSort {
  return fiberSortFromLines(result.lines, kind)
}

/**
 * Optional later: ingest Drive sort JSON when Heavy’s measure lands
 * (`/workspace/drive_inv/DATA_TEST_SORT_*.json`). Accepts either the FiberSort
 * shape or `{ claimed: number[], source: number[] }`.
 */
export function tryParseDriveFiberSort(raw: unknown): FiberSort | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (Array.isArray(o.nodes) && Array.isArray(o.edges)) {
    const nodes = o.nodes as FiberNode[]
    if (!nodes.length) return null
    const grantIds = Array.isArray(o.grantIds)
      ? (o.grantIds as string[])
      : nodes.filter(isGrantNode).map((n) => n.id)
    const refuseIds = Array.isArray(o.refuseIds)
      ? (o.refuseIds as string[])
      : nodes.filter((n) => !isGrantNode(n)).map((n) => n.id)
    const edges = Array.isArray(o.edges) && (o.edges as FiberEdge[]).length
      ? (o.edges as FiberEdge[])
      : weaveEdges(nodes, grantIds, refuseIds)
    return { nodes, edges, grantIds, refuseIds }
  }
  if (Array.isArray(o.claimed) && Array.isArray(o.source)) {
    return buildFiberSort(o.claimed as number[], o.source as number[], { kind: 'drive' })
  }
  return null
}

export function fiberNodeToLineDelta(n: FiberNode, index = 0): LineDelta {
  const ok = isGrantNode(n)
  return {
    index,
    claimed: n.claimed,
    source: n.source,
    ok,
    overage: ok ? 0 : n.claimed - n.source,
  }
}
