/** Dense C≤S sort-core dendrite / particle-ring SVG (cyan→violet, MAX-ref density). */
export function DendriteRing({ size = 240 }: { size?: number }) {
  const cx = 100
  const cy = 100
  const spokes = 96
  const ringDots = 220
  const tipDots = 84
  const midDots = 64

  const branches = Array.from({ length: spokes }, (_, i) => {
    const a = (i / spokes) * Math.PI * 2 - Math.PI / 2
    const len = 24 + ((i * 17) % 26) + (i % 7) * 2.1
    const x0 = cx + Math.cos(a) * 30
    const y0 = cy + Math.sin(a) * 30
    const x1 = cx + Math.cos(a) * 36
    const y1 = cy + Math.sin(a) * 36
    const x2 = cx + Math.cos(a) * (42 + len)
    const y2 = cy + Math.sin(a) * (42 + len)
    const mx = cx + Math.cos(a + (i % 2 ? 0.16 : -0.13)) * (42 + len * 0.48)
    const my = cy + Math.sin(a + (i % 2 ? 0.16 : -0.13)) * (42 + len * 0.48)
    // secondary fork
    const a2 = a + (i % 2 ? 0.22 : -0.19)
    const fx = cx + Math.cos(a2) * (42 + len * 0.78)
    const fy = cy + Math.sin(a2) * (42 + len * 0.78)
    // tertiary micro-fork
    const a3 = a + (i % 3 === 0 ? 0.32 : i % 3 === 1 ? -0.28 : 0.08)
    const tx = cx + Math.cos(a3) * (42 + len * 0.58)
    const ty = cy + Math.sin(a3) * (42 + len * 0.58)
    return { a, x0, y0, x1, y1, x2, y2, mx, my, fx, fy, tx, ty, i, len }
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
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="35%" stopColor="#2f7bff" />
          <stop offset="70%" stopColor="#6b3dff" />
          <stop offset="100%" stopColor="#9b4dff" />
        </linearGradient>
        <linearGradient id="fleetRingOut" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#8a3dff" />
        </linearGradient>
        <radialGradient id="fleetGlow" cx="50%" cy="50%" r="58%">
          <stop offset="0%" stopColor="rgba(0,229,255,0.34)" />
          <stop offset="40%" stopColor="rgba(47,123,255,0.16)" />
          <stop offset="70%" stopColor="rgba(122,61,255,0.08)" />
          <stop offset="100%" stopColor="rgba(155,77,255,0)" />
        </radialGradient>
        <filter id="softBloom" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r="90" fill="url(#fleetGlow)" />

      {/* faint orbital ellipses */}
      <ellipse
        cx={cx}
        cy={cy}
        rx="80"
        ry="52"
        fill="none"
        stroke="rgba(15,30,60,0.1)"
        strokeWidth="0.55"
      />
      <ellipse
        cx={cx}
        cy={cy}
        rx="64"
        ry="76"
        fill="none"
        stroke="rgba(15,30,60,0.08)"
        strokeWidth="0.5"
      />
      <ellipse
        cx={cx}
        cy={cy}
        rx="90"
        ry="60"
        fill="none"
        stroke="rgba(47,123,255,0.09)"
        strokeWidth="0.45"
      />

      {/* dendrite trunks + fractal forks */}
      <g filter="url(#softBloom)" opacity="0.95">
        {branches.map((b) => (
          <g key={b.i}>
            <path
              d={`M ${b.x0} ${b.y0} L ${b.x1} ${b.y1} Q ${b.mx} ${b.my} ${b.x2} ${b.y2}`}
              fill="none"
              stroke="url(#fleetRing)"
              strokeWidth={0.42 + (b.i % 5) * 0.14}
              opacity={0.42 + (b.i % 7) * 0.08}
              strokeLinecap="round"
            />
            {b.i % 2 === 0 && (
              <path
                d={`M ${(b.x1 + b.mx) / 2} ${(b.y1 + b.my) / 2} Q ${b.mx} ${b.my} ${b.fx} ${b.fy}`}
                fill="none"
                stroke="url(#fleetRingOut)"
                strokeWidth={0.32 + (b.i % 3) * 0.1}
                opacity={0.36 + (b.i % 5) * 0.07}
                strokeLinecap="round"
              />
            )}
            {b.i % 3 === 0 && (
              <path
                d={`M ${(b.x1 + b.mx) / 2} ${(b.y1 + b.my) / 2} L ${b.tx} ${b.ty}`}
                fill="none"
                stroke="url(#fleetRing)"
                strokeWidth={0.26}
                opacity={0.32 + (b.i % 4) * 0.06}
                strokeLinecap="round"
              />
            )}
          </g>
        ))}
      </g>

      {/* dense particle ring (thick energetic band) */}
      {Array.from({ length: ringDots }, (_, i) => {
        const t = i / ringDots
        const a = t * Math.PI * 2 - Math.PI / 2
        const wobble = ((i * 19) % 11) * 0.42
        const band = (i % 6) * 1.55
        const r = 30 + band + wobble
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        return (
          <circle
            key={`r-${i}`}
            cx={x}
            cy={y}
            r={0.55 + (i % 6) * 0.28}
            fill="url(#fleetRing)"
            opacity={0.55 + (i % 5) * 0.09}
          />
        )
      })}

      {/* mid-radius particle scatter */}
      {Array.from({ length: midDots }, (_, i) => {
        const a = (i / midDots) * Math.PI * 2 + 0.37
        const r = 48 + ((i * 7) % 17) * 1.4
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        return (
          <circle
            key={`m-${i}`}
            cx={x}
            cy={y}
            r={0.4 + (i % 4) * 0.18}
            fill="url(#fleetRingOut)"
            opacity={0.4 + (i % 3) * 0.12}
          />
        )
      })}

      {/* tip glitter along branch ends */}
      {Array.from({ length: tipDots }, (_, i) => {
        const b = branches[i % spokes]
        const t = 0.58 + (i % 6) * 0.07
        const x = b.x1 * (1 - t) + b.x2 * t + ((i % 5) - 2) * 1.05
        const y = b.y1 * (1 - t) + b.y2 * t + ((i % 3) - 1) * 1.0
        return (
          <circle
            key={`t-${i}`}
            cx={x}
            cy={y}
            r={0.42 + (i % 4) * 0.2}
            fill="url(#fleetRing)"
            opacity={0.45 + (i % 4) * 0.12}
          />
        )
      })}

      <circle
        cx={cx}
        cy={cy}
        r="25"
        fill="#fff"
        stroke="url(#fleetRing)"
        strokeWidth="2"
      />
      <circle
        cx={cx}
        cy={cy}
        r="27.5"
        fill="none"
        stroke="rgba(0,229,255,0.28)"
        strokeWidth="0.8"
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
