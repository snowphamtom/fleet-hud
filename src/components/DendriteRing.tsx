/**
 * Torus mesh sort-core — polygonal lattice + luminous vertices.
 * Nodes visibly scramble → migrate into GRANT (cyan) / REFUSE (rose)
 * clusters when SortingDemo fires, then settle. Phone-ok rAF + SVG.
 */
import { useEffect, useMemo, useRef } from 'react'
import type { LineDelta, Verdict } from '../lib/sort'

type Pt = { x: number; y: number; z: number; u: number; v: number }

export type SortPhase = 'idle' | 'scramble' | 'sorting' | 'settled'

type Props = {
  size?: number
  /** Bumps on every Demo GRANT / REFUSE / SORT to restart the animation. */
  sortKey?: number
  lines?: LineDelta[]
  verdict?: Verdict | null
}

const CX = 100
const CY = 100
const R = 52
const R_TUBE = 22
const TILT = 0.62
const SEGS_U = 40
const SEGS_V = 14
const NODE_COUNT = 56
const DUST = 72

/** Phase timings (ms) */
const T_SCRAMBLE = 320
const T_SORT = 1100
const T_SETTLE_HOLD = 1600
const T_EASE_HOME = 900

function torusPoint(u: number, v: number, tilt = TILT): Pt {
  const cosU = Math.cos(u)
  const sinU = Math.sin(u)
  const cosV = Math.cos(v)
  const sinV = Math.sin(v)
  const x3 = (R + R_TUBE * cosV) * cosU
  const y3 = (R + R_TUBE * cosV) * sinU
  const z3 = R_TUBE * sinV
  const y = y3 * Math.cos(tilt) - z3 * Math.sin(tilt)
  const z = y3 * Math.sin(tilt) + z3 * Math.cos(tilt)
  const persp = 1 / (1 + z * 0.0042)
  return { x: CX + x3 * persp, y: CY + y * persp, z, u, v }
}

function depthOpacity(z: number, base: number) {
  const t = (z + 28) / 56
  return Math.min(0.98, Math.max(0.12, base * (0.45 + t * 0.7)))
}

function depthWidth(z: number, base: number) {
  const t = (z + 28) / 56
  return base * (0.55 + t * 0.75)
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function hash(i: number, salt = 1) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

type Movable = {
  home: Pt
  /** Stable index for line assignment */
  id: number
  scramble: { x: number; y: number }
  target: { x: number; y: number }
  ok: boolean
}

function buildMesh() {
  const grid: Pt[][] = []
  for (let i = 0; i < SEGS_U; i++) {
    const row: Pt[] = []
    const u = (i / SEGS_U) * Math.PI * 2
    for (let j = 0; j < SEGS_V; j++) {
      const v = (j / SEGS_V) * Math.PI * 2
      row.push(torusPoint(u, v))
    }
    grid.push(row)
  }

  type Edge = { a: Pt; b: Pt; key: string }
  const edges: Edge[] = []
  const verts: Pt[] = []

  for (let i = 0; i < SEGS_U; i++) {
    const i2 = (i + 1) % SEGS_U
    for (let j = 0; j < SEGS_V; j++) {
      const j2 = (j + 1) % SEGS_V
      const p = grid[i][j]
      verts.push(p)
      edges.push({ a: p, b: grid[i2][j], key: `u-${i}-${j}` })
      edges.push({ a: p, b: grid[i][j2], key: `v-${i}-${j}` })
      if ((i + j) % 2 === 0) {
        edges.push({ a: p, b: grid[i2][j2], key: `d-${i}-${j}` })
      }
    }
  }

  const sortedEdges = [...edges].sort((e1, e2) => {
    const z1 = (e1.a.z + e1.b.z) / 2
    const z2 = (e2.a.z + e2.b.z) / 2
    return z1 - z2
  })
  const sortedVerts = [...verts].sort((a, b) => a.z - b.z)

  // Dedicated sort beads sampled around the torus (even spacing)
  const homes: Pt[] = []
  for (let i = 0; i < NODE_COUNT; i++) {
    const u = (i / NODE_COUNT) * Math.PI * 2
    const v = ((i * 5) % 11) * ((Math.PI * 2) / 11)
    homes.push(torusPoint(u, v))
  }

  return { sortedEdges, sortedVerts, homes }
}

function clusterTarget(ok: boolean, i: number, n: number) {
  // GRANT / ok → left cyan cluster; REFUSE / bad → right rose cluster
  const side = ok ? -1 : 1
  const cx = CX + side * 38
  const cy = CY - 2
  const col = Math.floor(i / Math.ceil(n / 4))
  const row = i % Math.ceil(n / 4)
  const spreadX = (row - 3) * 3.2 + (hash(i, 3) - 0.5) * 4
  const spreadY = (col - 1.5) * 5.5 + (hash(i, 7) - 0.5) * 5
  return {
    x: cx + spreadX * (ok ? 1 : 1),
    y: cy + spreadY,
  }
}

export function DendriteRing({ size = 240, sortKey = 0, lines, verdict = null }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const latticeRef = useRef<SVGGElement>(null)
  const nodesRef = useRef<SVGGElement>(null)
  const phaseRef = useRef<SortPhase>('idle')
  const movablesRef = useRef<Movable[]>([])
  const animRef = useRef<number>(0)
  const sortStartRef = useRef<number>(0)
  const lastSortKey = useRef(0)
  const linesRef = useRef<LineDelta[] | undefined>(lines)
  const verdictRef = useRef(verdict)
  const coreLabelRef = useRef<SVGTextElement>(null)
  const coreSubRef = useRef<SVGTextElement>(null)
  const coreRingRef = useRef<SVGCircleElement>(null)

  const mesh = useMemo(() => buildMesh(), [])

  // Keep latest sort payload for the rAF loop without re-subscribing
  useEffect(() => {
    linesRef.current = lines
    verdictRef.current = verdict
  }, [lines, verdict])

  // Init movables once
  useEffect(() => {
    movablesRef.current = mesh.homes.map((home, id) => ({
      home,
      id,
      scramble: { x: home.x, y: home.y },
      target: { x: home.x, y: home.y },
      ok: true,
    }))
  }, [mesh])

  // Kick sort animation when sortKey changes
  useEffect(() => {
    if (!sortKey || sortKey === lastSortKey.current) return
    lastSortKey.current = sortKey
    const ls = linesRef.current
    if (!ls || ls.length === 0) return

    const okCount = ls.filter((l) => l.ok).length
    const badCount = ls.length - okCount
    let okIdx = 0
    let badIdx = 0

    movablesRef.current = movablesRef.current.map((m) => {
      const line = ls[m.id % ls.length]
      const ok = line.ok
      const idx = ok ? okIdx++ : badIdx++
      const n = ok
        ? Math.max(okCount, 1) * Math.ceil(NODE_COUNT / ls.length)
        : Math.max(badCount, 1) * Math.ceil(NODE_COUNT / ls.length)
      return {
        ...m,
        ok,
        scramble: {
          x: m.home.x + (hash(m.id, sortKey) - 0.5) * 54,
          y: m.home.y + (hash(m.id, sortKey + 9) - 0.5) * 48 - 18,
        },
        target: clusterTarget(ok, idx, Math.max(n, 8)),
      }
    })

    // Start clock BEFORE flipping phase so the rAF tick never sees scramble with t0=0
    sortStartRef.current = performance.now()
    phaseRef.current = 'scramble'
    nodesRef.current?.setAttribute('data-phase', 'scramble')
    svgRef.current?.setAttribute('data-sorting', '1')
  }, [sortKey])

  // Main rAF loop — idle drift + sort phases; mutates DOM (no React re-render/frame)
  useEffect(() => {
    const circles = () =>
      nodesRef.current
        ? (Array.from(nodesRef.current.querySelectorAll('circle.sort-node')) as SVGCircleElement[])
        : []

    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(32, now - last)
      last = now
      const movables = movablesRef.current
      const els = circles()
      const phase = phaseRef.current
      const tOrbit = now * 0.00035

      if (phase === 'idle') {
        // Subtle orbit: rotate home positions slightly around center
        for (let i = 0; i < movables.length; i++) {
          const m = movables[i]
          const el = els[i]
          if (!el) continue
          const ang = tOrbit + m.id * 0.11
          const dx = Math.cos(ang) * 1.6 + Math.sin(ang * 0.7 + m.id) * 0.6
          const dy = Math.sin(ang * 0.85) * 1.2
          el.setAttribute('cx', String(m.home.x + dx))
          el.setAttribute('cy', String(m.home.y + dy))
          el.setAttribute('fill', 'url(#nodeCore)')
          el.setAttribute('opacity', String(0.55 + depthOpacity(m.home.z, 0.4)))
        }
        if (latticeRef.current) {
          const rot = ((now * 0.004) % 360).toFixed(2)
          latticeRef.current.setAttribute('transform', `rotate(${rot} ${CX} ${CY})`)
        }
        if (coreLabelRef.current) coreLabelRef.current.textContent = 'C ≤ S'
        if (coreSubRef.current) coreSubRef.current.textContent = 'SORT CORE'
        if (coreRingRef.current) {
          coreRingRef.current.setAttribute('stroke', 'url(#meshLine)')
        }
      } else {
        if (!sortStartRef.current) sortStartRef.current = now
        const elapsed = now - sortStartRef.current
        let px = 0
        let py = 0
        let fill = 'url(#nodeCore)'
        let nextPhase: SortPhase = phase

        if (elapsed < T_SCRAMBLE) {
          nextPhase = 'scramble'
          const t = easeInOut(elapsed / T_SCRAMBLE)
          for (let i = 0; i < movables.length; i++) {
            const m = movables[i]
            const el = els[i]
            if (!el) continue
            px = lerp(m.home.x, m.scramble.x, t)
            py = lerp(m.home.y, m.scramble.y, t)
            // jitter
            px += Math.sin(now * 0.02 + i) * (1 - t) * 2
            py += Math.cos(now * 0.018 + i) * (1 - t) * 2
            el.setAttribute('cx', String(px))
            el.setAttribute('cy', String(py))
            el.setAttribute('r', String(1.4 + t * 1.1))
            el.setAttribute('fill', '#ffe08a')
            el.setAttribute('opacity', '0.95')
          }
          if (coreSubRef.current) coreSubRef.current.textContent = 'SCRAMBLE'
        } else if (elapsed < T_SCRAMBLE + T_SORT) {
          nextPhase = 'sorting'
          const t = easeInOut((elapsed - T_SCRAMBLE) / T_SORT)
          for (let i = 0; i < movables.length; i++) {
            const m = movables[i]
            const el = els[i]
            if (!el) continue
            px = lerp(m.scramble.x, m.target.x, t)
            py = lerp(m.scramble.y, m.target.y, t)
            el.setAttribute('cx', String(px))
            el.setAttribute('cy', String(py))
            el.setAttribute('r', String(2.1 - t * 0.3))
            fill = m.ok ? '#3dfff0' : '#ff6b8a'
            el.setAttribute('fill', fill)
            el.setAttribute('opacity', String(0.75 + t * 0.25))
          }
          if (coreSubRef.current) coreSubRef.current.textContent = 'SORTING…'
          if (coreLabelRef.current) {
            coreLabelRef.current.textContent = verdictRef.current ?? 'C ≤ S'
          }
          if (coreRingRef.current) {
            coreRingRef.current.setAttribute(
              'stroke',
              verdictRef.current === 'GRANT' ? '#3dfff0' : '#ff6b8a',
            )
          }
        } else if (elapsed < T_SCRAMBLE + T_SORT + T_SETTLE_HOLD) {
          nextPhase = 'settled'
          for (let i = 0; i < movables.length; i++) {
            const m = movables[i]
            const el = els[i]
            if (!el) continue
            // soft breathe at cluster
            const b = Math.sin(now * 0.006 + i * 0.4) * 0.8
            el.setAttribute('cx', String(m.target.x + b * 0.3))
            el.setAttribute('cy', String(m.target.y + b * 0.2))
            el.setAttribute('r', '1.85')
            el.setAttribute('fill', m.ok ? '#3dfff0' : '#ff6b8a')
            el.setAttribute('opacity', '0.98')
          }
          if (coreLabelRef.current) {
            coreLabelRef.current.textContent = verdictRef.current ?? 'C ≤ S'
          }
          if (coreSubRef.current) {
            coreSubRef.current.textContent = verdictRef.current === 'GRANT' ? 'GRANTED' : 'REFUSED'
          }
        } else if (elapsed < T_SCRAMBLE + T_SORT + T_SETTLE_HOLD + T_EASE_HOME) {
          nextPhase = 'settled'
          const t = easeInOut(
            (elapsed - T_SCRAMBLE - T_SORT - T_SETTLE_HOLD) / T_EASE_HOME,
          )
          for (let i = 0; i < movables.length; i++) {
            const m = movables[i]
            const el = els[i]
            if (!el) continue
            px = lerp(m.target.x, m.home.x, t)
            py = lerp(m.target.y, m.home.y, t)
            el.setAttribute('cx', String(px))
            el.setAttribute('cy', String(py))
            el.setAttribute('r', String(lerp(1.85, 1.1, t)))
            // blend color back to gold
            el.setAttribute('fill', t > 0.6 ? 'url(#nodeCore)' : m.ok ? '#3dfff0' : '#ff6b8a')
            el.setAttribute('opacity', String(lerp(0.98, 0.7, t)))
          }
          if (coreSubRef.current) coreSubRef.current.textContent = 'SORT CORE'
          if (coreLabelRef.current) coreLabelRef.current.textContent = 'C ≤ S'
        } else {
          nextPhase = 'idle'
          svgRef.current?.removeAttribute('data-sorting')
          nodesRef.current?.setAttribute('data-phase', 'idle')
          if (coreRingRef.current) coreRingRef.current.setAttribute('stroke', 'url(#meshLine)')
          // restore radii
          for (let i = 0; i < els.length; i++) {
            els[i]?.setAttribute('r', String(1.05 + (i % 5 === 0 ? 0.35 : 0)))
          }
        }

        if (nextPhase !== phase) {
          phaseRef.current = nextPhase
          nodesRef.current?.setAttribute('data-phase', nextPhase)
        }

        // Dim / freeze lattice during active sort
        if (latticeRef.current) {
          const dim =
            nextPhase === 'idle' ? 1 : nextPhase === 'settled' ? 0.55 : 0.35
          latticeRef.current.style.opacity = String(dim)
          // keep slow spin but reduce during scramble
          const rot = ((now * (nextPhase === 'scramble' ? 0.012 : 0.004)) % 360).toFixed(2)
          latticeRef.current.setAttribute('transform', `rotate(${rot} ${CX} ${CY})`)
        }
      }

      // silence unused dt in idle path
      void dt
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const sortedEdges = mesh.sortedEdges
  const sortedVerts = mesh.sortedVerts

  return (
    <svg
      ref={svgRef}
      className="dendrite dendrite-mesh"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden
      data-phase="idle"
    >
      <defs>
        <radialGradient id="meshVoid" cx="50%" cy="48%" r="62%">
          <stop offset="0%" stopColor="#1a1208" />
          <stop offset="55%" stopColor="#0a0806" />
          <stop offset="100%" stopColor="#050403" />
        </radialGradient>
        <radialGradient id="meshHeat" cx="50%" cy="50%" r="42%">
          <stop offset="0%" stopColor="rgba(255,210,90,0.55)" />
          <stop offset="35%" stopColor="rgba(255,140,40,0.28)" />
          <stop offset="70%" stopColor="rgba(255,90,20,0.08)" />
          <stop offset="100%" stopColor="rgba(255,60,0,0)" />
        </radialGradient>
        <linearGradient id="meshLine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="40%" stopColor="#ffb347" />
          <stop offset="75%" stopColor="#ff7a1a" />
          <stop offset="100%" stopColor="#e85d04" />
        </linearGradient>
        <radialGradient id="nodeCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8e0" />
          <stop offset="45%" stopColor="#ffd060" />
          <stop offset="100%" stopColor="#ff8a20" />
        </radialGradient>
        <filter id="meshBloom" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.8" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="sortGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.2" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={CX} cy={CY} r="96" fill="url(#meshVoid)" />
      <circle cx={CX} cy={CY} r="96" fill="none" stroke="rgba(255,180,60,0.12)" strokeWidth="0.6" />

      <ellipse cx={CX} cy={CY + 2} rx="58" ry="38" fill="url(#meshHeat)" opacity="0.9" />
      <ellipse cx={CX} cy={CY - 4} rx="40" ry="26" fill="url(#meshHeat)" opacity="0.55" />

      {Array.from({ length: DUST }, (_, i) => {
        const a = (i / DUST) * Math.PI * 2 + ((i * 13) % 7) * 0.11
        const rr = 28 + ((i * 17) % 55)
        const x = CX + Math.cos(a) * rr + ((i % 5) - 2) * 1.2
        const y = CY + Math.sin(a) * rr * 0.72 + ((i % 3) - 1) * 1.4
        return (
          <circle
            key={`d-${i}`}
            cx={x}
            cy={y}
            r={0.25 + (i % 4) * 0.18}
            fill="#ffc857"
            opacity={0.18 + (i % 5) * 0.1}
          />
        )
      })}

      {/* lattice — slow spin via rAF transform */}
      <g ref={latticeRef} filter="url(#meshBloom)" className="dendrite-lattice">
        {sortedEdges.map((e) => {
          const zMid = (e.a.z + e.b.z) / 2
          const isDiag = e.key.startsWith('d-')
          return (
            <line
              key={e.key}
              x1={e.a.x}
              y1={e.a.y}
              x2={e.b.x}
              y2={e.b.y}
              stroke="url(#meshLine)"
              strokeWidth={depthWidth(zMid, isDiag ? 0.28 : 0.42)}
              opacity={depthOpacity(zMid, isDiag ? 0.55 : 0.82)}
              strokeLinecap="round"
            />
          )
        })}
        {sortedVerts.map((p, i) => {
          if (i % 3 !== 0) return null
          const bright = depthOpacity(p.z, 1)
          const rad = 0.4 + bright * 0.55
          return (
            <circle
              key={`lv-${i}`}
              cx={p.x}
              cy={p.y}
              r={rad}
              fill="url(#nodeCore)"
              opacity={0.25 + bright * 0.35}
            />
          )
        })}
        {Array.from({ length: SEGS_U }, (_, i) => {
          const u = (i / SEGS_U) * Math.PI * 2
          const inner = torusPoint(u, Math.PI)
          const next = torusPoint(((i + 1) / SEGS_U) * Math.PI * 2, Math.PI)
          return (
            <line
              key={`hot-${i}`}
              x1={inner.x}
              y1={inner.y}
              x2={next.x}
              y2={next.y}
              stroke="#ffe9a8"
              strokeWidth={depthWidth(inner.z, 0.7)}
              opacity={depthOpacity(inner.z, 0.95)}
              strokeLinecap="round"
            />
          )
        })}
      </g>

      {/* Movable sort nodes — positions driven by rAF */}
      <g ref={nodesRef} filter="url(#sortGlow)" className="dendrite-sort-nodes" data-phase="idle">
        {mesh.homes.map((p, i) => (
          <circle
            key={`sn-${i}`}
            className="sort-node"
            cx={p.x}
            cy={p.y}
            r={1.05 + (i % 5 === 0 ? 0.35 : 0)}
            fill="url(#nodeCore)"
            opacity={0.7}
          />
        ))}
      </g>

      {/* Cluster zone hints (visible while sorting via CSS) */}
      <ellipse
        className="cluster-hint grant-hint"
        cx={CX - 38}
        cy={CY}
        rx="28"
        ry="36"
        fill="rgba(61,255,240,0.06)"
        stroke="rgba(61,255,240,0.22)"
        strokeWidth="0.6"
      />
      <ellipse
        className="cluster-hint refuse-hint"
        cx={CX + 38}
        cy={CY}
        rx="28"
        ry="36"
        fill="rgba(255,107,138,0.06)"
        stroke="rgba(255,107,138,0.22)"
        strokeWidth="0.6"
      />

      <circle
        ref={coreRingRef}
        cx={CX}
        cy={CY}
        r="23"
        fill="#0c0a08"
        stroke="url(#meshLine)"
        strokeWidth="1.6"
      />
      <circle
        cx={CX}
        cy={CY}
        r="25.5"
        fill="none"
        stroke="rgba(255,180,60,0.35)"
        strokeWidth="0.7"
      />
      <text
        ref={coreLabelRef}
        x={CX}
        y={CY + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className="dendrite-law dendrite-law-mesh"
      >
        C ≤ S
      </text>
      <text
        ref={coreSubRef}
        x={CX}
        y={CY + 12}
        textAnchor="middle"
        className="dendrite-sub dendrite-sub-mesh"
      >
        SORT CORE
      </text>
    </svg>
  )
}
