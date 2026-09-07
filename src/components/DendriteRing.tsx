/**
 * Torus mesh sort-core — polygonal lattice + luminous vertices + inner heat glow.
 * Gold/amber energy matching Taylor anti-bland torus ref (phone-performant SVG).
 */
type Pt = { x: number; y: number; z: number; u: number; v: number }

function torusPoint(
  cx: number,
  cy: number,
  R: number,
  r: number,
  u: number,
  v: number,
  tilt: number,
): Pt {
  const cosU = Math.cos(u)
  const sinU = Math.sin(u)
  const cosV = Math.cos(v)
  const sinV = Math.sin(v)
  const x3 = (R + r * cosV) * cosU
  const y3 = (R + r * cosV) * sinU
  const z3 = r * sinV
  // slight perspective tilt for depth
  const y = y3 * Math.cos(tilt) - z3 * Math.sin(tilt)
  const z = y3 * Math.sin(tilt) + z3 * Math.cos(tilt)
  const persp = 1 / (1 + z * 0.0042)
  return {
    x: cx + x3 * persp,
    y: cy + y * persp,
    z,
    u,
    v,
  }
}

function depthOpacity(z: number, base: number) {
  // brighter toward camera / near side of tube
  const t = (z + 28) / 56
  return Math.min(0.98, Math.max(0.12, base * (0.45 + t * 0.7)))
}

function depthWidth(z: number, base: number) {
  const t = (z + 28) / 56
  return base * (0.55 + t * 0.75)
}

export function DendriteRing({ size = 240 }: { size?: number }) {
  const cx = 100
  const cy = 100
  const R = 52 // major radius
  const r = 22 // tube radius
  const tilt = 0.62
  const segsU = 40 // around torus
  const segsV = 14 // around tube
  const dust = 90

  const grid: Pt[][] = []
  for (let i = 0; i < segsU; i++) {
    const row: Pt[] = []
    const u = (i / segsU) * Math.PI * 2
    for (let j = 0; j < segsV; j++) {
      const v = (j / segsV) * Math.PI * 2
      row.push(torusPoint(cx, cy, R, r, u, v, tilt))
    }
    grid.push(row)
  }

  type Edge = { a: Pt; b: Pt; key: string }
  const edges: Edge[] = []
  const verts: Pt[] = []

  for (let i = 0; i < segsU; i++) {
    const i2 = (i + 1) % segsU
    for (let j = 0; j < segsV; j++) {
      const j2 = (j + 1) % segsV
      const p = grid[i][j]
      verts.push(p)
      // u-ring edges
      edges.push({ a: p, b: grid[i2][j], key: `u-${i}-${j}` })
      // v-ring edges
      edges.push({ a: p, b: grid[i][j2], key: `v-${i}-${j}` })
      // diagonal for triangular lattice feel (every other)
      if ((i + j) % 2 === 0) {
        edges.push({ a: p, b: grid[i2][j2], key: `d-${i}-${j}` })
      }
    }
  }

  // sort back-to-front so nearer edges paint last
  const sortedEdges = [...edges].sort((e1, e2) => {
    const z1 = (e1.a.z + e1.b.z) / 2
    const z2 = (e2.a.z + e2.b.z) / 2
    return z1 - z2
  })
  const sortedVerts = [...verts].sort((a, b) => a.z - b.z)

  return (
    <svg
      className="dendrite dendrite-mesh"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden
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
      </defs>

      {/* dark inset disc for mesh contrast */}
      <circle cx={cx} cy={cy} r="96" fill="url(#meshVoid)" />
      <circle cx={cx} cy={cy} r="96" fill="none" stroke="rgba(255,180,60,0.12)" strokeWidth="0.6" />

      {/* inner-curve heat bloom */}
      <ellipse cx={cx} cy={cy + 2} rx="58" ry="38" fill="url(#meshHeat)" opacity="0.9" />
      <ellipse cx={cx} cy={cy - 4} rx="40" ry="26" fill="url(#meshHeat)" opacity="0.55" />

      {/* particle dust field */}
      {Array.from({ length: dust }, (_, i) => {
        const a = (i / dust) * Math.PI * 2 + ((i * 13) % 7) * 0.11
        const rr = 28 + ((i * 17) % 55)
        const x = cx + Math.cos(a) * rr + ((i % 5) - 2) * 1.2
        const y = cy + Math.sin(a) * rr * 0.72 + ((i % 3) - 1) * 1.4
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

      {/* polygonal lattice edges (back → front) */}
      <g filter="url(#meshBloom)">
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
      </g>

      {/* luminous vertex nodes */}
      <g filter="url(#nodeGlow)">
        {sortedVerts.map((p, i) => {
          // subsample slightly for performance — every vertex still, but tiny back ones
          const bright = depthOpacity(p.z, 1)
          const rad = 0.55 + bright * 0.95 + (i % 5 === 0 ? 0.35 : 0)
          return (
            <circle
              key={`n-${i}`}
              cx={p.x}
              cy={p.y}
              r={rad}
              fill="url(#nodeCore)"
              opacity={0.35 + bright * 0.65}
            />
          )
        })}
      </g>

      {/* hot inner rim highlight (tube inner curve) */}
      {Array.from({ length: segsU }, (_, i) => {
        // sample tube at v = π (inner toward hole) and v ≈ 0 outer
        const u = (i / segsU) * Math.PI * 2
        const inner = torusPoint(cx, cy, R, r, u, Math.PI, tilt)
        const next = torusPoint(cx, cy, R, r, ((i + 1) / segsU) * Math.PI * 2, Math.PI, tilt)
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

      {/* C≤S law core */}
      <circle cx={cx} cy={cy} r="23" fill="#0c0a08" stroke="url(#meshLine)" strokeWidth="1.6" />
      <circle
        cx={cx}
        cy={cy}
        r="25.5"
        fill="none"
        stroke="rgba(255,180,60,0.35)"
        strokeWidth="0.7"
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className="dendrite-law dendrite-law-mesh"
      >
        C ≤ S
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="dendrite-sub dendrite-sub-mesh">
        SORT CORE
      </text>
    </svg>
  )
}
