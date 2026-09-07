import { useEffect, useState } from 'react'
import type { ProcessSnapshot } from '../data/processTypes'

export type StageId = 'mara' | 'cole' | 'rina' | 'vince' | 'execute'

type StageMeta = {
  id: StageId
  label: string
  short: string
  angle: number
}

const STAGES: StageMeta[] = [
  { id: 'mara', label: 'MARA', short: 'SCAN', angle: -90 },
  { id: 'cole', label: 'COLE', short: 'PROPOSE', angle: -18 },
  { id: 'rina', label: 'RINA', short: 'PLATES', angle: 54 },
  { id: 'vince', label: 'VINCE', short: 'HOLDS', angle: 126 },
  { id: 'execute', label: 'EXECUTE', short: 'MOVES', angle: 198 },
]

function statusTone(id: StageId, snap: ProcessSnapshot): 'done' | 'hold' | 'partial' {
  if (id === 'mara') return snap.mara.status === 'DONE' ? 'done' : 'hold'
  if (id === 'cole') return snap.cole.status === 'DONE' ? 'done' : 'hold'
  if (id === 'rina') return snap.rina.status === 'DONE' ? 'done' : 'hold'
  if (id === 'vince') return 'hold'
  return snap.execute.status === 'PARTIAL' ? 'partial' : 'done'
}

type Props = {
  snap: ProcessSnapshot
  active: StageId
  onSelect: (id: StageId) => void
  litThrough: number
}

export function ProcessRing({ snap, active, onSelect, litThrough }: Props) {
  const size = 320
  const cx = size / 2
  const cy = size / 2
  const r = 112
  const trackR = 128

  return (
    <div className="pring" role="img" aria-label="Klaus Drive process ring">
      <svg viewBox={`0 0 ${size} ${size}`} className="pring-svg" width="100%" height="100%">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,255,200,0.22)" />
            <stop offset="55%" stopColor="rgba(0,180,255,0.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffc8" />
            <stop offset="50%" stopColor="#3aa0ff" />
            <stop offset="100%" stopColor="#ffb020" />
          </linearGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={148} fill="url(#coreGlow)" />
        <circle
          cx={cx}
          cy={cy}
          r={trackR}
          fill="none"
          stroke="rgba(120,160,200,0.14)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r + 8}
          fill="none"
          stroke="rgba(0,255,200,0.12)"
          strokeWidth="22"
        />

        {/* progress arc lit by stage count */}
        <circle
          cx={cx}
          cy={cy}
          r={r + 8}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(litThrough / 5) * 2 * Math.PI * (r + 8)} ${2 * Math.PI * (r + 8)}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          filter="url(#softGlow)"
          className="pring-progress"
        />

        {STAGES.map((s, i) => {
          const rad = (s.angle * Math.PI) / 180
          const x = cx + r * Math.cos(rad)
          const y = cy + r * Math.sin(rad)
          const tone = statusTone(s.id, snap)
          const lit = i < litThrough
          const isActive = active === s.id
          return (
            <g
              key={s.id}
              className={`pring-node ${tone} ${lit ? 'lit' : ''} ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(s.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={x}
                cy={y}
                r={isActive ? 28 : 24}
                className="pring-node-hit"
                fill="rgba(6,12,20,0.92)"
                stroke="currentColor"
                strokeWidth={isActive ? 2.4 : 1.6}
                filter={lit ? 'url(#softGlow)' : undefined}
              />
              <text
                x={x}
                y={y - 3}
                textAnchor="middle"
                className="pring-node-label"
                fill="currentColor"
              >
                {s.label}
              </text>
              <text
                x={x}
                y={y + 11}
                textAnchor="middle"
                className="pring-node-sub"
                fill="currentColor"
              >
                {s.short}
              </text>
            </g>
          )
        })}

        {/* center readout */}
        <circle cx={cx} cy={cy} r={54} fill="rgba(4,8,14,0.88)" stroke="rgba(0,255,200,0.35)" strokeWidth="1.2" />
        <text x={cx} y={cy - 14} textAnchor="middle" className="pring-core-kicker" fill="#7ad9c4">
          PROCESS
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" className="pring-core-num" fill="#e8f7ff">
          {snap.execute.totalMoves}
        </text>
        <text x={cx} y={cy + 26} textAnchor="middle" className="pring-core-unit" fill="#8aa4b8">
          MOVES · 0 FAIL
        </text>
      </svg>
      <div className="pring-orbit" aria-hidden />
    </div>
  )
}

export function useRingLightUp(max = 5, stepMs = 520, restartKey?: string) {
  const [lit, setLit] = useState(0)
  useEffect(() => {
    setLit(0)
    let n = 0
    const id = window.setInterval(() => {
      n += 1
      setLit(n)
      if (n >= max) window.clearInterval(id)
    }, stepMs)
    return () => window.clearInterval(id)
  }, [max, stepMs, restartKey])
  return lit
}

export { STAGES }
