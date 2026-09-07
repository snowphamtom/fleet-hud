/** One law: C ≤ S componentwise → GRANT / REFUSE */

export type Verdict = 'GRANT' | 'REFUSE'

export type LineDelta = {
  index: number
  claimed: number
  source: number
  ok: boolean
  overage: number
}

export type SortResult = {
  verdict: Verdict
  lines: LineDelta[]
  claimed: number[]
  source: number[]
}

export function parseNums(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n))
}

export function sortClaim(claimed: number[], source: number[]): SortResult {
  const n = Math.max(claimed.length, source.length)
  const lines: LineDelta[] = []
  let allOk = true
  for (let i = 0; i < n; i++) {
    const c = claimed[i] ?? 0
    const s = source[i] ?? 0
    const ok = c <= s
    if (!ok) allOk = false
    lines.push({ index: i, claimed: c, source: s, ok, overage: ok ? 0 : c - s })
  }
  return {
    verdict: allOk && n > 0 ? 'GRANT' : 'REFUSE',
    lines,
    claimed,
    source,
  }
}

export const DEMO_GRANT = {
  label: 'Expense claim — lodging under receipt',
  claimed: [90, 40, 20, 10],
  source: [100, 50, 25, 10],
}

export const DEMO_REFUSE = {
  label: 'Expense claim — lodging $1 over receipt',
  claimed: [101, 40, 20, 10],
  source: [100, 50, 25, 10],
}
