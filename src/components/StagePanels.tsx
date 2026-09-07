import { STAGES, type Stage } from '../lib/config'
import { SectionLabel } from './SectionLabel'

type Props = {
  pulse: number
  metrics: {
    throughput: number
    routeHealth: number
    heat: number[]
    bars: number[]
  }
  stageCounts: Record<Stage, number>
}

const STAGE_HINT: Record<Stage, string> = {
  Intake: 'AgentMail / URL only',
  Filter: 'kill rule · real object?',
  Evidence: 'scrape + line ledger',
  Verdict: 'ResidualGates C≤S',
  Store: 'vault + live board',
}

export function StagePanels({ pulse, metrics, stageCounts }: Props) {
  return (
    <section className="stage-grid" aria-label="Sorting stages">
      {STAGES.map((stage, i) => {
        const active = pulse === i
        return (
          <article key={stage} className={`panel stage-panel ${active ? 'pulse' : ''}`}>
            <SectionLabel title={stage.toUpperCase()} value={stageCounts[stage]} />
            <p className="stage-hint">{STAGE_HINT[stage]}</p>
            <div className="mini-bars" aria-hidden>
              {metrics.bars.slice(0, 8).map((v, bi) => (
                <span
                  key={bi}
                  style={{ height: `${18 + v * 28}px`, opacity: active ? 1 : 0.55 }}
                />
              ))}
            </div>
          </article>
        )
      })}

      <article className="panel stage-panel wide">
        <SectionLabel title="THROUGHPUT" value={`${metrics.throughput}/s`} />
        <div className="heat-grid" aria-hidden>
          {metrics.heat.map((v, i) => (
            <span
              key={i}
              style={{
                background: `linear-gradient(135deg, rgba(0,212,255,${0.22 + v * 0.75}), rgba(138,61,255,${0.14 + v * 0.65}))`,
              }}
            />
          ))}
        </div>
        <div className="panel-foot">
          route health {metrics.routeHealth}% · // prefer-live
        </div>
      </article>
    </section>
  )
}
