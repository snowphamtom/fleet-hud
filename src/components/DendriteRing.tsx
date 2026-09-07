/**
 * Torus mesh + SSB/Dandelin sort-core.
 * Idle: symmetric ring near φ=0 (Goldstone tangential drift).
 * Sort: scramble → vacuum selection — nodes migrate along cone
 * generators toward GRANT (F, cyan) or REFUSE (F′, rose) foci
 * of the plane∩cone ellipse. Phone-ok rAF + SVG attr mutation.
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

/** Dandelin foci of the cutting-plane ellipse (GRANT=F, REFUSE=F′) */
const FOCUS_GRANT = { x: CX - 42, y: CY + 2 }
const FOCUS_REFUSE = { x: CX + 42, y: CY + 2 }
/** Soft cone apex for generator arcs */
const APEX = { x: CX, y: CY - 78 }

/** Phase timings (ms) */
const T_SCRAMBLE = 380
const T_SORT = 1200
const T_SETTLE_HOLD = 1700
const T_EASE_HOME = 950

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

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function hash(i: number, salt = 1) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Idle home on a tight symmetric ring (φ≈0 peak neighborhood → valley rim). */
function peakRingHome(i: number, n: number): Pt {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2
  // slight ellipse so it reads as the cutting-plane orbit
  const rx = 34 + (hash(i, 2) - 0.5) * 3
  const ry = 22 + (hash(i, 5) - 0.5) * 2.4
  const x = CX + Math.cos(a) * rx
  const y = CY + Math.sin(a) * ry
  // map onto torus depth for opacity cues
  const tp = torusPoint(a, ((i * 5) % 11) * ((Math.PI * 2) / 11))
  return { x, y, z: tp.z * 0.35, u: a, v: 0 }
}

type Movable = {
  home: Pt
  id: number
  scramble: { x: number; y: number }
  /** Control point for generator-arc migration (toward apex then focus) */
  ctrl: { x: number; y: number }
  target: { x: number; y: number }
  ok: boolean
  /** Angle on idle ring for Goldstone tangential drift */
  theta: number
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

  const homes: Pt[] = []
  for (let i = 0; i < NODE_COUNT; i++) {
    homes.push(peakRingHome(i, NODE_COUNT))
  }

  return { sortedEdges, sortedVerts, homes }
}

/** Cluster around a Dandelin focus with soft spread. */
function focusCluster(focus: { x: number; y: number }, i: number, n: number) {
  const ang = (i / Math.max(n, 1)) * Math.PI * 2 + hash(i, 11) * 0.4
  const rad = 4 + Math.sqrt(i + 1) * 2.8 + (hash(i, 4) - 0.5) * 3.2
  return {
    x: focus.x + Math.cos(ang) * rad * 0.85,
    y: focus.y + Math.sin(ang) * rad * 0.7,
  }
}

/** Quadratic Bezier point — node path along a cone generator toward focus. */
function qBez(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
) {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  }
}

/** Control point pulls toward apex then down the generator to the focus. */
function generatorCtrl(
  from: { x: number; y: number },
  focus: { x: number; y: number },
  id: number,
) {
  // blend apex with mid of from→focus so path reads as a cone generator
  const midX = (from.x + focus.x) * 0.5
  const midY = (from.y + focus.y) * 0.5
  return {
    x: lerp(midX, APEX.x, 0.55) + (hash(id, 13) - 0.5) * 18,
    y: lerp(midY, APEX.y, 0.62) + (hash(id, 17) - 0.5) * 10,
  }
}

export function DendriteRing({ size = 240, sortKey = 0, lines, verdict = null }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const latticeRef = useRef<SVGGElement>(null)
  const nodesRef = useRef<SVGGElement>(null)
  const geomRef = useRef<SVGGElement>(null)
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

  useEffect(() => {
    linesRef.current = lines
    verdictRef.current = verdict
  }, [lines, verdict])

  useEffect(() => {
    movablesRef.current = mesh.homes.map((home, id) => ({
      home,
      id,
      scramble: { x: home.x, y: home.y },
      ctrl: { x: home.x, y: home.y },
      target: { x: home.x, y: home.y },
      ok: true,
      theta: (id / NODE_COUNT) * Math.PI * 2,
    }))
  }, [mesh])

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
      const nSide = ok
        ? Math.max(okCount, 1) * Math.ceil(NODE_COUNT / ls.length)
        : Math.max(badCount, 1) * Math.ceil(NODE_COUNT / ls.length)
      const focus = ok ? FOCUS_GRANT : FOCUS_REFUSE
      // scramble: explode off the peak (symmetry break)
      const burstAng = m.theta + (hash(m.id, sortKey) - 0.5) * 1.8
      const burstR = 18 + hash(m.id, sortKey + 3) * 48
      const scramble = {
        x: CX + Math.cos(burstAng) * burstR + (hash(m.id, 8) - 0.5) * 12,
        y: CY + Math.sin(burstAng) * burstR * 0.72 - 8,
      }
      const target = focusCluster(focus, idx, Math.max(nSide, 8))
      return {
        ...m,
        ok,
        scramble,
        ctrl: generatorCtrl(scramble, focus, m.id + sortKey),
        target,
      }
    })

    sortStartRef.current = performance.now()
    phaseRef.current = 'scramble'
    nodesRef.current?.setAttribute('data-phase', 'scramble')
    svgRef.current?.setAttribute('data-sorting', '1')
    geomRef.current?.setAttribute('opacity', '0.85')
  }, [sortKey])

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
      const tOrbit = now * 0.00042

      if (phase === 'idle') {
        // Goldstone tangential drift on the symmetric valley rim + light radial restore
        for (let i = 0; i < movables.length; i++) {
          const m = movables[i]
          const el = els[i]
          if (!el) continue
          const ang = m.theta + tOrbit
          const rx = 34
          const ry = 22
          // radial restore toward ring (Mexican-hat valley floor)
          const baseX = CX + Math.cos(ang) * rx
          const baseY = CY + Math.sin(ang) * ry
          const wobble = Math.sin(now * 0.0028 + m.id) * 0.9
          el.setAttribute('cx', String(baseX + wobble * 0.35))
          el.setAttribute('cy', String(baseY + Math.cos(now * 0.0022 + m.id) * 0.45))
          // cyan→violet density along the ring (fleet FUI)
          const hueT = (Math.cos(ang) + 1) * 0.5
          el.setAttribute('fill', hueT > 0.55 ? 'url(#nodeViolet)' : 'url(#nodeCyan)')
          el.setAttribute('opacity', String(0.62 + depthOpacity(m.home.z, 0.35)))
          el.setAttribute('r', String(1.15 + (i % 5 === 0 ? 0.4 : 0)))
        }
        if (latticeRef.current) {
          const rot = ((now * 0.004) % 360).toFixed(2)
          latticeRef.current.setAttribute('transform', `rotate(${rot} ${CX} ${CY})`)
          latticeRef.current.style.opacity = '1'
        }
        if (geomRef.current) geomRef.current.setAttribute('opacity', '0.28')
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
        let nextPhase: SortPhase = phase

        if (elapsed < T_SCRAMBLE) {
          nextPhase = 'scramble'
          const t = easeOutCubic(elapsed / T_SCRAMBLE)
          for (let i = 0; i < movables.length; i++) {
            const m = movables[i]
            const el = els[i]
            if (!el) continue
            // leave peak → scramble cloud (symmetry break)
            px = lerp(m.home.x, m.scramble.x, t)
            py = lerp(m.home.y, m.scramble.y, t)
            px += Math.sin(now * 0.025 + i) * (1 - t) * 3.2
            py += Math.cos(now * 0.022 + i) * (1 - t) * 2.8
            el.setAttribute('cx', String(px))
            el.setAttribute('cy', String(py))
            el.setAttribute('r', String(1.5 + t * 1.2))
            el.setAttribute('fill', '#e8f4ff')
            el.setAttribute('opacity', '0.95')
          }
          if (coreSubRef.current) coreSubRef.current.textContent = '⟨φ⟩ BREAK'
          if (geomRef.current) geomRef.current.setAttribute('opacity', String(0.35 + t * 0.4))
        } else if (elapsed < T_SCRAMBLE + T_SORT) {
          nextPhase = 'sorting'
          const t = easeInOut((elapsed - T_SCRAMBLE) / T_SORT)
          for (let i = 0; i < movables.length; i++) {
            const m = movables[i]
            const el = els[i]
            if (!el) continue
            // migrate along cone generator (quadratic toward focus)
            const p = qBez(m.scramble, m.ctrl, m.target, t)
            el.setAttribute('cx', String(p.x))
            el.setAttribute('cy', String(p.y))
            el.setAttribute('r', String(2.2 - t * 0.35))
            el.setAttribute('fill', m.ok ? '#3dfff0' : '#ff6b8a')
            el.setAttribute('opacity', String(0.78 + t * 0.22))
          }
          if (coreSubRef.current) coreSubRef.current.textContent = 'VACUUM…'
          if (coreLabelRef.current) {
            coreLabelRef.current.textContent = verdictRef.current ?? 'C ≤ S'
          }
          if (coreRingRef.current) {
            coreRingRef.current.setAttribute(
              'stroke',
              verdictRef.current === 'GRANT' ? '#3dfff0' : '#ff6b8a',
            )
          }
          if (geomRef.current) geomRef.current.setAttribute('opacity', '0.9')
        } else if (elapsed < T_SCRAMBLE + T_SORT + T_SETTLE_HOLD) {
          nextPhase = 'settled'
          for (let i = 0; i < movables.length; i++) {
            const m = movables[i]
            const el = els[i]
            if (!el) continue
            // Goldstone tangential drift around focus + radial restore
            const focus = m.ok ? FOCUS_GRANT : FOCUS_REFUSE
            const dx = m.target.x - focus.x
            const dy = m.target.y - focus.y
            const rad = Math.hypot(dx, dy) || 1
            const baseAng = Math.atan2(dy, dx)
            const drift = now * 0.0011 + m.id * 0.15
            const ang = baseAng + Math.sin(drift) * 0.18
            // radial restore: spring slightly toward focus radius
            const rTarget = rad
            const rNow = rTarget + Math.sin(drift * 1.3) * 0.6
            const gx = focus.x + Math.cos(ang) * rNow
            const gy = focus.y + Math.sin(ang) * rNow * 0.92
            el.setAttribute('cx', String(gx))
            el.setAttribute('cy', String(gy))
            el.setAttribute('r', '1.9')
            el.setAttribute('fill', m.ok ? '#3dfff0' : '#ff6b8a')
            el.setAttribute('opacity', '0.98')
          }
          if (coreLabelRef.current) {
            coreLabelRef.current.textContent = verdictRef.current ?? 'C ≤ S'
          }
          if (coreSubRef.current) {
            coreSubRef.current.textContent =
              verdictRef.current === 'GRANT' ? 'GRANTED' : 'REFUSED'
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
            el.setAttribute('r', String(lerp(1.9, 1.15, t)))
            const hueT = (Math.cos(m.theta) + 1) * 0.5
            el.setAttribute(
              'fill',
              t > 0.55
                ? hueT > 0.55
                  ? 'url(#nodeViolet)'
                  : 'url(#nodeCyan)'
                : m.ok
                  ? '#3dfff0'
                  : '#ff6b8a',
            )
            el.setAttribute('opacity', String(lerp(0.98, 0.7, t)))
          }
          if (coreSubRef.current) coreSubRef.current.textContent = 'SORT CORE'
          if (coreLabelRef.current) coreLabelRef.current.textContent = 'C ≤ S'
          if (geomRef.current) geomRef.current.setAttribute('opacity', String(0.9 - t * 0.62))
        } else {
          nextPhase = 'idle'
          svgRef.current?.removeAttribute('data-sorting')
          nodesRef.current?.setAttribute('data-phase', 'idle')
          if (coreRingRef.current) coreRingRef.current.setAttribute('stroke', 'url(#meshLine)')
          if (geomRef.current) geomRef.current.setAttribute('opacity', '0.28')
          for (let i = 0; i < els.length; i++) {
            els[i]?.setAttribute('r', String(1.15 + (i % 5 === 0 ? 0.4 : 0)))
          }
        }

        if (nextPhase !== phase) {
          phaseRef.current = nextPhase
          nodesRef.current?.setAttribute('data-phase', nextPhase)
        }

        if (latticeRef.current) {
          const dim =
            nextPhase === 'idle' ? 1 : nextPhase === 'settled' ? 0.5 : 0.28
          latticeRef.current.style.opacity = String(dim)
          const rot = ((now * (nextPhase === 'scramble' ? 0.014 : 0.004)) % 360).toFixed(2)
          latticeRef.current.setAttribute('transform', `rotate(${rot} ${CX} ${CY})`)
        }
      }

      void dt
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const sortedEdges = mesh.sortedEdges
  const sortedVerts = mesh.sortedVerts

  // FUI-thin Dandelin silhouette paths (cone + cutting ellipse + generators)
  const coneL = `M ${APEX.x} ${APEX.y} L ${CX - 78} ${CY + 72}`
  const coneR = `M ${APEX.x} ${APEX.y} L ${CX + 78} ${CY + 72}`
  const genPaths = Array.from({ length: 7 }, (_, i) => {
    const t = (i + 1) / 8
    const bx = lerp(CX - 78, CX + 78, t)
    return `M ${APEX.x} ${APEX.y} L ${bx} ${CY + 72}`
  })

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
          <stop offset="0%" stopColor="#0c1424" />
          <stop offset="55%" stopColor="#070b14" />
          <stop offset="100%" stopColor="#04060c" />
        </radialGradient>
        <radialGradient id="meshHeat" cx="42%" cy="48%" r="48%">
          <stop offset="0%" stopColor="rgba(0,212,255,0.42)" />
          <stop offset="40%" stopColor="rgba(90,80,255,0.22)" />
          <stop offset="75%" stopColor="rgba(138,61,255,0.08)" />
          <stop offset="100%" stopColor="rgba(138,61,255,0)" />
        </radialGradient>
        <linearGradient id="meshLine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5ef0ff" />
          <stop offset="45%" stopColor="#7a8cff" />
          <stop offset="100%" stopColor="#b44dff" />
        </linearGradient>
        <linearGradient id="fleetCyanViolet" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#3dfff0" />
          <stop offset="100%" stopColor="#b44dff" />
        </linearGradient>
        <radialGradient id="nodeCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8fbff" />
          <stop offset="45%" stopColor="#5ef0ff" />
          <stop offset="100%" stopColor="#7a5cff" />
        </radialGradient>
        <radialGradient id="nodeCyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8ffff" />
          <stop offset="55%" stopColor="#3dfff0" />
          <stop offset="100%" stopColor="#00b8d4" />
        </radialGradient>
        <radialGradient id="nodeViolet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0e8ff" />
          <stop offset="55%" stopColor="#b44dff" />
          <stop offset="100%" stopColor="#7a3dff" />
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
      <circle cx={CX} cy={CY} r="96" fill="none" stroke="rgba(90,200,255,0.14)" strokeWidth="0.6" />

      <ellipse cx={CX} cy={CY + 2} rx="58" ry="38" fill="url(#meshHeat)" opacity="0.9" />
      <ellipse cx={CX} cy={CY - 4} rx="40" ry="26" fill="url(#meshHeat)" opacity="0.5" />

      {/* FUI-thin Dandelin / plane∩cone silhouette */}
      <g ref={geomRef} className="dandelin-geom" opacity="0.28" fill="none">
        <path d={coneL} stroke="rgba(180,220,255,0.28)" strokeWidth="0.45" />
        <path d={coneR} stroke="rgba(180,220,255,0.28)" strokeWidth="0.45" />
        {genPaths.map((d, i) => (
          <path
            key={`gen-${i}`}
            d={d}
            stroke="rgba(140,180,255,0.12)"
            strokeWidth="0.3"
          />
        ))}
        {/* cutting-plane ellipse (orbit) */}
        <ellipse
          cx={CX}
          cy={CY + 2}
          rx="54"
          ry="34"
          stroke="url(#fleetCyanViolet)"
          strokeWidth="0.55"
          opacity="0.55"
          strokeDasharray="2.2 2.8"
        />
        {/* plane edge hint */}
        <path
          d={`M ${CX - 62} ${CY - 18} L ${CX + 62} ${CY + 22}`}
          stroke="rgba(200,210,255,0.22)"
          strokeWidth="0.4"
        />
        {/* foci markers F / F′ */}
        <circle
          cx={FOCUS_GRANT.x}
          cy={FOCUS_GRANT.y}
          r="2.2"
          stroke="rgba(61,255,240,0.55)"
          strokeWidth="0.55"
          fill="rgba(61,255,240,0.08)"
        />
        <circle
          cx={FOCUS_REFUSE.x}
          cy={FOCUS_REFUSE.y}
          r="2.2"
          stroke="rgba(255,107,138,0.5)"
          strokeWidth="0.55"
          fill="rgba(255,107,138,0.08)"
        />
        <text
          x={FOCUS_GRANT.x}
          y={FOCUS_GRANT.y - 6}
          textAnchor="middle"
          className="focus-label"
          fill="rgba(61,255,240,0.55)"
          fontSize="4.5"
          fontFamily="ui-monospace, monospace"
        >
          F
        </text>
        <text
          x={FOCUS_REFUSE.x}
          y={FOCUS_REFUSE.y - 6}
          textAnchor="middle"
          className="focus-label"
          fill="rgba(255,107,138,0.5)"
          fontSize="4.5"
          fontFamily="ui-monospace, monospace"
        >
          F′
        </text>
      </g>

      {Array.from({ length: DUST }, (_, i) => {
        const a = (i / DUST) * Math.PI * 2 + ((i * 13) % 7) * 0.11
        const rr = 28 + ((i * 17) % 55)
        const x = CX + Math.cos(a) * rr + ((i % 5) - 2) * 1.2
        const y = CY + Math.sin(a) * rr * 0.72 + ((i % 3) - 1) * 1.4
        const cool = i % 3 !== 0
        return (
          <circle
            key={`d-${i}`}
            cx={x}
            cy={y}
            r={0.25 + (i % 4) * 0.18}
            fill={cool ? '#7ad4ff' : '#c48cff'}
            opacity={0.16 + (i % 5) * 0.09}
          />
        )
      })}

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
              opacity={depthOpacity(zMid, isDiag ? 0.5 : 0.78)}
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
              opacity={0.22 + bright * 0.32}
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
              stroke="#a8f0ff"
              strokeWidth={depthWidth(inner.z, 0.65)}
              opacity={depthOpacity(inner.z, 0.88)}
              strokeLinecap="round"
            />
          )
        })}
      </g>

      <g ref={nodesRef} filter="url(#sortGlow)" className="dendrite-sort-nodes" data-phase="idle">
        {mesh.homes.map((p, i) => (
          <circle
            key={`sn-${i}`}
            className="sort-node"
            cx={p.x}
            cy={p.y}
            r={1.15 + (i % 5 === 0 ? 0.4 : 0)}
            fill="url(#nodeCyan)"
            opacity={0.72}
          />
        ))}
      </g>

      {/* Focus zone hints */}
      <ellipse
        className="cluster-hint grant-hint"
        cx={FOCUS_GRANT.x}
        cy={FOCUS_GRANT.y}
        rx="30"
        ry="34"
        fill="rgba(61,255,240,0.06)"
        stroke="rgba(61,255,240,0.28)"
        strokeWidth="0.6"
      />
      <ellipse
        className="cluster-hint refuse-hint"
        cx={FOCUS_REFUSE.x}
        cy={FOCUS_REFUSE.y}
        rx="30"
        ry="34"
        fill="rgba(255,107,138,0.06)"
        stroke="rgba(255,107,138,0.28)"
        strokeWidth="0.6"
      />

      <circle
        ref={coreRingRef}
        cx={CX}
        cy={CY}
        r="20"
        fill="#080c14"
        stroke="url(#meshLine)"
        strokeWidth="1.5"
      />
      <circle
        cx={CX}
        cy={CY}
        r="22.5"
        fill="none"
        stroke="rgba(90,200,255,0.32)"
        strokeWidth="0.65"
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
        y={CY + 11}
        textAnchor="middle"
        className="dendrite-sub dendrite-sub-mesh"
      >
        SORT CORE
      </text>
    </svg>
  )
}
