import { useEffect, useState } from 'react'

export type LiveMetrics = {
  throughput: number
  actions: number
  hits: string
  routeHealth: number
  heat: number[]
  bars: number[]
  stagePulse: number
}

const HEAT_LEN = 42

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function useLiveMetrics(actionsBase: number): LiveMetrics {
  const [m, setM] = useState<LiveMetrics>(() => ({
    throughput: 12,
    actions: actionsBase,
    hits: '3/5',
    routeHealth: 98.2,
    heat: Array.from({ length: HEAT_LEN }, () => Math.random()),
    bars: Array.from({ length: 12 }, () => rand(0.2, 1)),
    stagePulse: 0,
  }))

  useEffect(() => {
    const id = window.setInterval(() => {
      setM((prev) => ({
        throughput: Math.round(rand(8, 22)),
        actions: actionsBase + Math.floor(rand(0, 3)),
        hits: prev.hits,
        routeHealth: Math.round(rand(97.4, 99.6) * 10) / 10,
        heat: prev.heat.map((v, i) =>
          i === Math.floor(Math.random() * HEAT_LEN) ? Math.min(1, v + rand(0.1, 0.4)) : v * 0.995,
        ),
        bars: prev.bars.map((v) => Math.min(1, Math.max(0.15, v + rand(-0.15, 0.18)))),
        stagePulse: (prev.stagePulse + 1) % 5,
      }))
    }, 1400)
    return () => window.clearInterval(id)
  }, [actionsBase])

  return { ...m, actions: Math.max(m.actions, actionsBase) }
}
