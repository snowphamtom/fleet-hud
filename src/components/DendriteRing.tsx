/** Generative C≤S sort-core dendrite / ring SVG (decorative + identity). */
export function DendriteRing({ size = 220 }: { size?: number }) {
  const cx = 100
  const cy = 100
  const spokes = 36
  const dots = 48

  const branches = Array.from({ length: spokes }, (_, i) => {
    const a = (i / spokes) * Math.PI * 2 - Math.PI / 2
    const len = 28 + ((i * 7) % 17)
    const x2 = cx + Math.cos(a) * (42 + len)
    const y2 = cy + Math.sin(a) * (42 + len)
    const mx = cx + Math.cos(a + 0.12) * (42 + len * 0.55)
    const my = cy + Math.sin(a + 0.12) * (42 + len * 0.55)
    return { a, x2, y2, mx, my, i }
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
          <stop offset="55%" stopColor="#3d6bff" />
          <stop offset="100%" stopColor="#7a3dff" />
        </linearGradient>
        <radialGradient id="fleetGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,194,255,0.18)" />
          <stop offset="100%" stopColor="rgba(122,61,255,0)" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r="78" fill="url(#fleetGlow)" />
      <ellipse
        cx={cx}
        cy={cy}
        rx="72"
        ry="48"
        fill="none"
        stroke="rgba(15,30,60,0.06)"
        strokeWidth="0.6"
      />
      <ellipse
        cx={cx}
        cy={cy}
        rx="58"
        ry="70"
        fill="none"
        stroke="rgba(15,30,60,0.05)"
        strokeWidth="0.6"
      />

      {branches.map((b) => (
        <path
          key={b.i}
          d={`M ${cx + Math.cos(b.a) * 36} ${cy + Math.sin(b.a) * 36} Q ${b.mx} ${b.my} ${b.x2} ${b.y2}`}
          fill="none"
          stroke="url(#fleetRing)"
          strokeWidth={0.55 + (b.i % 3) * 0.15}
          opacity={0.35 + (b.i % 5) * 0.08}
          strokeLinecap="round"
        />
      ))}

      {Array.from({ length: dots }, (_, i) => {
        const t = i / dots
        const a = t * Math.PI * 2 - Math.PI / 2
        const r = 34 + (i % 3) * 2.2
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={1.1 + (i % 4) * 0.25}
            fill="url(#fleetRing)"
            opacity={0.55 + (i % 3) * 0.12}
          />
        )
      })}

      <circle
        cx={cx}
        cy={cy}
        r="26"
        fill="#fff"
        stroke="url(#fleetRing)"
        strokeWidth="1.4"
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
      <text x={cx} y={cy + 14} textAnchor="middle" className="dendrite-sub">
        SORT CORE
      </text>
    </svg>
  )
}
