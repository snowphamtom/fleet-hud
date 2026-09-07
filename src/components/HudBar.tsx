type Props = {
  actions: number
  hits: string
  live: boolean
}

export function HudBar({ actions, hits, live }: Props) {
  return (
    <header className="hud-bar">
      <div className="hud-brand">
        <div className="hud-title">FLEET HUD — SORTING MACHINE</div>
        <div className="hud-sub">PHONE-FIRST · C ≤ S · ONE LAW</div>
      </div>
      <div className="hud-metrics" aria-label="Live metrics">
        <span>
          HITS <b>{hits}</b>
        </span>
        <span className="hud-sep" />
        <span>
          ACTIONS <b>{actions.toLocaleString()}</b>
        </span>
        <span className="hud-sep" />
        <span>
          AUDIT <b>pending</b>
        </span>
        <span className="hud-sep" />
        <span className={`hud-live ${live ? 'on' : ''}`}>
          <i className="dot" /> LIVE
        </span>
      </div>
    </header>
  )
}
