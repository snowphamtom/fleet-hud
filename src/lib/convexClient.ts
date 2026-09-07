import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { ALL_GAS } from './config'
import type { SortResult, Verdict } from './sort'

/** Public Convex URL from env — fleet-gerbil-682 when configured. */
export function getConvexClient(): ConvexHttpClient | null {
  if (!ALL_GAS.convex.configured) return null
  return new ConvexHttpClient(ALL_GAS.convex.url)
}

const runSortRef = makeFunctionReference<
  'mutation',
  { claimed: number[]; source: number[] },
  SortResult & { id?: string }
>('sort:runSort')

const previewSortRef = makeFunctionReference<
  'query',
  { claimed: number[]; source: number[] },
  SortResult
>('sort:previewSort')

const pushEvidenceRef = makeFunctionReference<
  'mutation',
  {
    sourceId: string
    name: string
    mimeType?: string
    modifiedTime?: string
    rawText?: string
    status: string
    sizeBytes?: number
  },
  string
>('intake:pushEvidence')

export type ConvexSortResult = SortResult & { id?: string; via: 'convex' | 'local' }

/** Call sort.runSort when Convex configured; null on failure (caller falls back). */
export async function runSortConvex(
  claimed: number[],
  source: number[],
): Promise<SortResult | null> {
  const client = getConvexClient()
  if (!client) return null
  try {
    const result = await client.mutation(runSortRef, { claimed, source })
    if (!result || (result.verdict !== 'GRANT' && result.verdict !== 'REFUSE')) return null
    return {
      verdict: result.verdict as Verdict,
      lines: result.lines,
      claimed: result.claimed,
      source: result.source,
    }
  } catch {
    return null
  }
}

/** Call sort.previewSort when configured; null on failure. */
export async function previewSortConvex(
  claimed: number[],
  source: number[],
): Promise<SortResult | null> {
  const client = getConvexClient()
  if (!client) return null
  try {
    const result = await client.query(previewSortRef, { claimed, source })
    if (!result || (result.verdict !== 'GRANT' && result.verdict !== 'REFUSE')) return null
    return {
      verdict: result.verdict as Verdict,
      lines: result.lines,
      claimed: result.claimed,
      source: result.source,
    }
  } catch {
    return null
  }
}

export type PushEvidenceArgs = {
  sourceId: string
  name: string
  mimeType?: string
  modifiedTime?: string
  rawText?: string
  status: string
  sizeBytes?: number
}

/** Push a demo / intake evidence row. Returns id string or null. */
export async function pushEvidenceConvex(args: PushEvidenceArgs): Promise<string | null> {
  const client = getConvexClient()
  if (!client) return null
  try {
    const id = await client.mutation(pushEvidenceRef, args)
    return typeof id === 'string' ? id : String(id)
  } catch {
    return null
  }
}

export function pushDemoEvidence(): Promise<string | null> {
  const ts = Date.now()
  return pushEvidenceConvex({
    sourceId: `fleet-hud-demo-${ts}`,
    name: `Fleet HUD demo evidence ${new Date(ts).toISOString()}`,
    mimeType: 'text/plain',
    modifiedTime: new Date(ts).toISOString(),
    rawText: 'Demo evidence from Fleet HUD · C≤S sorting machine',
    status: 'ingested',
    sizeBytes: 64,
  })
}
