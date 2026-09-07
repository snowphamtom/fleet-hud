/** Spider-web fiber sort model — numbers drive positions/colors, not costume labels. */

import type { LineDelta, SortResult, Verdict } from './sort'

export type FiberKind = 'line' | 'receipt' | 'drive' | 'demo'

export type MimeKind = 'pdf' | 'gdoc' | 'image' | 'folder' | 'archive' | 'sheet' | 'other'

export type DriveBucket = 'keep' | 'watch' | 'ignore'

export type FiberNode = {
  id: string
  label: string
  claimed: number // C
  source: number // S
  kind: FiberKind
  /** Drive metrics — bucket derived from these, never folder-name labels */
  sizeBytes?: number
  mtimeAgeDays?: number
  mimeKind?: MimeKind
  bucket?: DriveBucket
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
  /** Drive clusters from size/mtime/mime — not path labels */
  keepIds?: string[]
  watchIds?: string[]
  ignoreIds?: string[]
  /** 'drive' → viz settles on keep/watch/ignore foci */
  clusterMode?: 'cs' | 'drive'
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

/** Weave within keep / watch / ignore clusters (Drive metrics). */
function weaveDriveEdges(
  nodes: FiberNode[],
  keepIds: string[],
  watchIds: string[],
  ignoreIds: string[],
): FiberEdge[] {
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
    // residual still C−S braid; size also encoded as secondary mass via claimed scale
    edges.push({ from, to, residual: residualOf(n) })
  }

  const ring = (ids: string[]) => {
    if (ids.length < 2) return
    for (let i = 0; i < ids.length; i++) {
      push(ids[i], ids[(i + 1) % ids.length])
      if (ids.length >= 4) push(ids[i], ids[(i + 2) % ids.length])
    }
  }

  ring(keepIds)
  ring(watchIds)
  ring(ignoreIds)
  return edges
}

export function sealFiberSort(nodes: FiberNode[]): FiberSort {
  const grantIds: string[] = []
  const refuseIds: string[] = []
  for (const n of nodes) {
    if (isGrantNode(n)) grantIds.push(n.id)
    else refuseIds.push(n.id)
  }
  return { nodes, edges: weaveEdges(nodes, grantIds, refuseIds), grantIds, refuseIds, clusterMode: 'cs' }
}

/**
 * Bucket from Drive metrics only (size / age / mime) — never path or folder name.
 * Tuned for clear visual clusters on the torus.
 */
export function driveBucketOf(m: {
  sizeBytes: number
  mtimeAgeDays: number
  mimeKind: MimeKind
}): DriveBucket {
  const { sizeBytes, mtimeAgeDays: age, mimeKind } = m
  const mb = sizeBytes / (1024 * 1024)
  const highValue = mimeKind === 'pdf' || mimeKind === 'gdoc' || mimeKind === 'sheet'

  // ignore: tiny noise / empty-ish / ancient media dumps
  if (sizeBytes < 2_048) return 'ignore'
  if (mimeKind === 'folder' && sizeBytes < 12_000) return 'ignore'
  if (age > 900 && mimeKind === 'image' && mb >= 8) return 'ignore'
  if (age > 730 && (mimeKind === 'image' || mimeKind === 'other') && mb < 0.05) return 'ignore'
  if (age > 1100 && !highValue) return 'ignore'

  // keep: recent (≤90d) + high-value mime + sane size band
  const saneBand = mb >= 0.008 && mb <= 45
  if (age <= 90 && highValue && saneBand) return 'keep'
  if (age <= 60 && mimeKind === 'folder' && mb >= 0.05 && mb < 8) return 'keep'
  if (age <= 30 && highValue) return 'keep'

  // watch: large archives / old-but-pdf / medium freshness / bulky
  if (mimeKind === 'archive' && mb >= 15) return 'watch'
  if (mimeKind === 'pdf' && age > 90 && age <= 800) return 'watch'
  if (age > 90 && age <= 420) return 'watch'
  if (mb >= 70) return 'watch'

  if (age > 420 && !highValue) return 'ignore'
  if (highValue) return 'keep'
  return 'watch'
}

/** Map Drive metrics → C/S so Never Again braid still seals GRANT/REFUSE. */
function driveMetricsToCS(m: {
  sizeBytes: number
  mtimeAgeDays: number
  mimeKind: MimeKind
  bucket: DriveBucket
}): { claimed: number; source: number } {
  const mb = Math.max(0.001, m.sizeBytes / (1024 * 1024))
  const sizeScore = Math.round(Math.min(200, Math.max(1, mb * 4 + Math.log10(m.sizeBytes + 10) * 8)))
  // freshness bonus on source (newer → more "source cover")
  const fresh = Math.max(0, 120 - m.mtimeAgeDays) / 120
  const mimeBoost =
    m.mimeKind === 'pdf' || m.mimeKind === 'gdoc' || m.mimeKind === 'sheet' ? 12 : m.mimeKind === 'folder' ? 4 : 0

  if (m.bucket === 'keep') {
    const source = sizeScore + mimeBoost + Math.round(fresh * 18)
    const claimed = Math.max(1, Math.round(source * (0.72 + fresh * 0.18)))
    return { claimed, source }
  }
  if (m.bucket === 'watch') {
    const source = sizeScore + Math.round(mimeBoost * 0.5)
    // near the line — slight overage for bulky / stale
    const claimed = Math.round(source * (1.02 + (m.mtimeAgeDays > 180 ? 0.08 : 0) + (mb > 40 ? 0.06 : 0)))
    return { claimed, source: Math.max(1, source) }
  }
  // ignore → clear C > S residual
  const source = Math.max(1, Math.round(sizeScore * 0.55))
  const claimed = Math.round(source * (1.35 + Math.min(0.5, m.mtimeAgeDays / 800)))
  return { claimed, source }
}

export function sealDriveFiberSort(nodes: FiberNode[]): FiberSort {
  const keepIds: string[] = []
  const watchIds: string[] = []
  const ignoreIds: string[] = []
  const grantIds: string[] = []
  const refuseIds: string[] = []
  for (const n of nodes) {
    const b = n.bucket ?? 'watch'
    if (b === 'keep') keepIds.push(n.id)
    else if (b === 'watch') watchIds.push(n.id)
    else ignoreIds.push(n.id)
    if (isGrantNode(n)) grantIds.push(n.id)
    else refuseIds.push(n.id)
  }
  return {
    nodes,
    edges: weaveDriveEdges(nodes, keepIds, watchIds, ignoreIds),
    grantIds,
    refuseIds,
    keepIds,
    watchIds,
    ignoreIds,
    clusterMode: 'drive',
  }
}

type DriveSeed = {
  sizeBytes: number
  mtimeAgeDays: number
  mimeKind: MimeKind
  /** Evidence id stub — not a folder costume label */
  tag: string
}

/** ~32 synthetic Drive-like nodes with mixed size / age / mime → clear K/W/I clusters. */
const DEMO_DRIVE_SEEDS: DriveSeed[] = [
  // keep — recent high-value
  { sizeBytes: 420_000, mtimeAgeDays: 12, mimeKind: 'pdf', tag: 'd01' },
  { sizeBytes: 88_000, mtimeAgeDays: 4, mimeKind: 'gdoc', tag: 'd02' },
  { sizeBytes: 1_200_000, mtimeAgeDays: 28, mimeKind: 'pdf', tag: 'd03' },
  { sizeBytes: 56_000, mtimeAgeDays: 9, mimeKind: 'sheet', tag: 'd04' },
  { sizeBytes: 310_000, mtimeAgeDays: 55, mimeKind: 'gdoc', tag: 'd05' },
  { sizeBytes: 2_400_000, mtimeAgeDays: 71, mimeKind: 'pdf', tag: 'd06' },
  { sizeBytes: 190_000, mtimeAgeDays: 22, mimeKind: 'sheet', tag: 'd07' },
  { sizeBytes: 640_000, mtimeAgeDays: 41, mimeKind: 'pdf', tag: 'd08' },
  { sizeBytes: 2_200_000, mtimeAgeDays: 18, mimeKind: 'folder', tag: 'd09' },
  { sizeBytes: 95_000, mtimeAgeDays: 33, mimeKind: 'gdoc', tag: 'd10' },
  // watch — archives, old pdf, medium freshness, bulky
  { sizeBytes: 85_000_000, mtimeAgeDays: 140, mimeKind: 'archive', tag: 'd11' },
  { sizeBytes: 12_000_000, mtimeAgeDays: 210, mimeKind: 'pdf', tag: 'd12' },
  { sizeBytes: 3_500_000, mtimeAgeDays: 160, mimeKind: 'other', tag: 'd13' },
  { sizeBytes: 48_000_000, mtimeAgeDays: 95, mimeKind: 'archive', tag: 'd14' },
  { sizeBytes: 900_000, mtimeAgeDays: 320, mimeKind: 'pdf', tag: 'd15' },
  { sizeBytes: 6_200_000, mtimeAgeDays: 250, mimeKind: 'sheet', tag: 'd16' },
  { sizeBytes: 110_000_000, mtimeAgeDays: 60, mimeKind: 'archive', tag: 'd17' },
  { sizeBytes: 1_800_000, mtimeAgeDays: 180, mimeKind: 'gdoc', tag: 'd18' },
  { sizeBytes: 22_000_000, mtimeAgeDays: 400, mimeKind: 'pdf', tag: 'd19' },
  { sizeBytes: 4_100_000, mtimeAgeDays: 110, mimeKind: 'folder', tag: 'd20' },
  // ignore — ancient media / tiny noise / empty-ish
  { sizeBytes: 480, mtimeAgeDays: 40, mimeKind: 'other', tag: 'd21' },
  { sizeBytes: 1_100, mtimeAgeDays: 200, mimeKind: 'image', tag: 'd22' },
  { sizeBytes: 8_000, mtimeAgeDays: 30, mimeKind: 'folder', tag: 'd23' },
  { sizeBytes: 25_000_000, mtimeAgeDays: 980, mimeKind: 'image', tag: 'd24' },
  { sizeBytes: 14_000_000, mtimeAgeDays: 1200, mimeKind: 'image', tag: 'd25' },
  { sizeBytes: 3_200, mtimeAgeDays: 800, mimeKind: 'other', tag: 'd26' },
  { sizeBytes: 900, mtimeAgeDays: 15, mimeKind: 'other', tag: 'd27' },
  { sizeBytes: 44_000_000, mtimeAgeDays: 1050, mimeKind: 'image', tag: 'd28' },
  { sizeBytes: 5_500, mtimeAgeDays: 600, mimeKind: 'folder', tag: 'd29' },
  { sizeBytes: 2_800_000, mtimeAgeDays: 1400, mimeKind: 'other', tag: 'd30' },
  { sizeBytes: 150, mtimeAgeDays: 90, mimeKind: 'image', tag: 'd31' },
  { sizeBytes: 18_000_000, mtimeAgeDays: 860, mimeKind: 'image', tag: 'd32' },
]

export function buildDemoDriveFiberSort(): FiberSort {
  const nodes: FiberNode[] = DEMO_DRIVE_SEEDS.map((seed, i) => {
    const bucket = driveBucketOf(seed)
    const { claimed, source } = driveMetricsToCS({ ...seed, bucket })
    return {
      id: `drive-${i}`,
      label: seed.tag,
      claimed,
      source,
      kind: 'drive' as const,
      sizeBytes: seed.sizeBytes,
      mtimeAgeDays: seed.mtimeAgeDays,
      mimeKind: seed.mimeKind,
      bucket,
    }
  })
  return sealDriveFiberSort(nodes)
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
 * Ingest Drive sort JSON when Heavy’s measure lands
 * (`/workspace/drive_inv/DATA_TEST_SORT_*.json`). Accepts FiberSort shape,
 * `{ claimed, source }`, or `{ files: [{ sizeBytes, mtimeAgeDays, mimeKind }] }`.
 */
export function tryParseDriveFiberSort(raw: unknown): FiberSort | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (Array.isArray(o.nodes) && Array.isArray(o.edges)) {
    const nodes = o.nodes as FiberNode[]
    if (!nodes.length) return null
    if (o.clusterMode === 'drive' || nodes.some((n) => n.bucket)) {
      return sealDriveFiberSort(nodes)
    }
    const grantIds = Array.isArray(o.grantIds)
      ? (o.grantIds as string[])
      : nodes.filter(isGrantNode).map((n) => n.id)
    const refuseIds = Array.isArray(o.refuseIds)
      ? (o.refuseIds as string[])
      : nodes.filter((n) => !isGrantNode(n)).map((n) => n.id)
    const edges = Array.isArray(o.edges) && (o.edges as FiberEdge[]).length
      ? (o.edges as FiberEdge[])
      : weaveEdges(nodes, grantIds, refuseIds)
    return { nodes, edges, grantIds, refuseIds, clusterMode: 'cs' }
  }
  if (Array.isArray(o.files)) {
    const files = o.files as Array<Record<string, unknown>>
    const nodes: FiberNode[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const sizeBytes = Number(f.sizeBytes ?? f.size ?? 0)
      const mtimeAgeDays = Number(f.mtimeAgeDays ?? f.ageDays ?? 0)
      const mimeKind = (String(f.mimeKind ?? f.mime ?? 'other') as MimeKind) || 'other'
      if (!Number.isFinite(sizeBytes) || !Number.isFinite(mtimeAgeDays)) continue
      const seed = { sizeBytes, mtimeAgeDays, mimeKind }
      const bucket = driveBucketOf(seed)
      const { claimed, source } = driveMetricsToCS({ ...seed, bucket })
      nodes.push({
        id: `drive-${i}`,
        label: `d${i + 1}`,
        claimed,
        source,
        kind: 'drive',
        sizeBytes,
        mtimeAgeDays,
        mimeKind,
        bucket,
      })
    }
    if (!nodes.length) return null
    return sealDriveFiberSort(nodes)
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

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}


export type FiberBucket = 'grant' | 'refuse' | 'keep' | 'watch' | 'ignore'

export function bucketOf(n: FiberNode): FiberBucket {
  if (n.bucket) return n.bucket
  return isGrantNode(n) ? 'grant' : 'refuse'
}

export function fiberColor(n: FiberNode): string {
  const b = bucketOf(n)
  switch (b) {
    case 'grant':
      return '#3dfff0'
    case 'keep':
      return '#5dff9a'
    case 'watch':
      return '#b44dff'
    case 'refuse':
      return '#ff6b8a'
    case 'ignore':
    default:
      return '#5a6a88'
  }
}

export function sizeWeight(n: FiberNode): number {
  const s = n.sizeBytes ?? 0
  if (s <= 0) return 0.12
  return Math.max(0.15, Math.min(1, Math.log10(s + 10) / 6))
}

export function freshnessOf(n: FiberNode): number {
  const age = n.mtimeAgeDays
  if (age == null) return 0.4
  return Math.max(0, Math.min(1, 1 - age / 365))
}

export function bucketCounts(fs: FiberSort): Record<string, number> {
  return {
    grant: fs.grantIds.length,
    refuse: fs.refuseIds.length,
    keep: fs.keepIds?.length ?? 0,
    watch: fs.watchIds?.length ?? 0,
    ignore: fs.ignoreIds?.length ?? 0,
  }
}
