/** Dense C≤S sort-core dendrite / particle-ring SVG (cyan→violet). */
export function DendriteRing({ size = 240 }: { size?: number }) {
  const cx = 100
  const cy = 100
  const spokes = 72
  const dots = 160
  const tipDots = 56

  const branches = Array.from({ length: spokes }, (_, i) => {
    const a = (i / spokes) * Math.PI * 2 - Math.PI / 2
    const len = 22 + ((i * 11) % 23) + (i % 5) * 2.4
    const x1 = cx + Math.cos(a) * 34
    const y1 = cy + Math.sin(a) * 34
    const x2 = cx + Math.cos(a) * (40 + len)
    const y2 = cy + Math.sin(a) * (40 + len)
    const mx = cx + Math.cos(a + (i % 2 ? 0.14 : -0.11)) * (40 + len * 0.52)
    const my = cy + Math.sin(a + (i % 2 ? 0.14 : -0.11)) * (40 + len * 0.52)
    // secondary fork
    const a2 = a + (i % 2 ? 0.18 : -0.16)
    const fx = cx + Math.cos(a2) * (40 + len * 0.72)
    const fy = cy + Math.sin(a2) * (40 + len * 0.72)
    return { a, x1, y1, x2, y2, mx, my, fx, fy, i, len }
  })

  return (
    <svg
      className="dendrite"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden
    >
      <defs>
        <linearGradient id="fleetRing" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#00c2ff" />
          <stop offset="45%" stopColor="#3d6bff" />
          <stop offset="100%" stopColor="#7a3dff" />
        </linearGradient>
        <radialGradient id="fleetGlow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(0,194,255,0.22)" />
          <stop offset="55%" stopColor="rgba(61,107,255,0.08)" />
          <stop offset="100%" stopColor="rgba(122,61,255,0)" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r="86" fill="url(#fleetGlow)" />

      {/* faint orbital ellipses */}
      <ellipse cx={cx} cy={cy} rx="78" ry="50" fill="none" stroke="rgba(15,30,60,0.07)" strokeWidth="0.5" />
      <ellipse cx={cx} cy={cy} rx="62" ry="74" fill="none" stroke="rgba(15,30,60,0.055)" strokeWidth="0.5" />
      <ellipse cx={cx} cy={cy} rx="88" ry="58" fill="none" stroke="rgba(15,30,60,0.04)" strokeWidth="0.45" />

      {/* dendrite trunks + forks */}
      {branches.map((b) => (
        <g key={b.i}>
          <path
            d={`M ${b.x1} ${b.y1} Q ${b.mx} ${b.my} ${b.x2} ${b.y2}`}
            fill="none"
            stroke="url(#fleetRing)"
            strokeWidth={0.35 + (b.i % 4) * 0.12}
            opacity={0.28 + (b.i % 7) * 0.07}
            strokeLinecap="round"
          />
          {b.i % 2 === 0 && (
            <path
              d={`M ${(b.x1 + b.mx) / 2} ${(b.y1 + b.my) / 2} Q ${b.mx} ${b.my} ${b.fx} ${b.fy}`}
              fill="none"
              stroke="url(#fleetRing)"
              strokeWidth={0.28 + (b.i % 3) * 0.08}
              opacity={0.22 + (b.i % 5) * 0.06}
              strokeLinecap="round"
            />
          )}
        </g>
      ))}

      {/* dense particle ring */}
      {Array.from({ length: dots }, (_, i) => {
        const t = i / dots
        const a = t * Math.PI * 2 - Math.PI / 2
        const wobble = ((i * 13) % 7) * 0.55
        const r = 32 + (i % 5) * 1.8 + wobble
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        return (
          <circle
            key={`r-${i}`}
            cx={x}
            cy={y}
            r={0.55 + (i % 5) * 0.22}
            fill="url(#fleetRing)"
            opacity={0.42 + (i % 4) * 0.14}
          />
        )
      })}

      {/* tip glitter along branch ends */}
      {Array.from({ length: tipDots }, (_, i) => {
        const b = branches[i % spokes]
        const t = 0.65 + (i % 5) * 0.07
        const x = b.x1 * (1 - t) + b.x2 * t + ((i % 3) - 1) * 1.2
        const y = b.y1 * (1 - t) + b.y2 * t + ((i % 2) - 0.5) * 1.1
        return (
          <circle
            key={`t-${i}`}
            cx={x}
            cy={y}
            r={0.45 + (i % 3) * 0.2}
            fill="url(#fleetRing)"
            opacity={0.35 + (i % 4) * 0.12}
          />
        )
      })}

      <circle
        cx={cx}
        cy={cy}
        r="24"
        fill="#fff"
        stroke="url(#fleetRing)"
        strokeWidth="1.5"
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className="dendrite-law"
      >
        C ≤ S
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" className="dendrite-sub">
        SORT CORE
      </text>
    </svg>
  )
}
