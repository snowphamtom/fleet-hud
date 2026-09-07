import { ALL_GAS } from '../lib/config'
import { SectionLabel } from './SectionLabel'

export function GrokStub() {
  const convexReady = ALL_GAS.convex.configured
  return (
    <article className="panel grok-stub">
      <SectionLabel title="GROK / xAI" value="stub" />
      <p className="stub-body">{ALL_GAS.grok.panel}</p>
      <div className="stub-chips">
        <span className="pill">{ALL_GAS.grok.model}</span>
        <span className="pill">{convexReady ? 'Convex env' : 'Convex pending'}</span>
        <span className="pill">Firecrawl stub</span>
        <span className="pill">AgentMail stub</span>
      </div>
      <dl className="stub-kv">
        <div>
          <dt>CONVEX</dt>
          <dd>
            {ALL_GAS.convex.url}
            {!convexReady ? (
              <span className="dim"> · set VITE_CONVEX_URL (Heavy NEW backend)</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>SITE</dt>
          <dd>{ALL_GAS.convex.site}</dd>
        </div>
        <div>
          <dt>FIRECRAWL</dt>
          <dd>{ALL_GAS.firecrawl.apiBase}</dd>
        </div>
        <div>
          <dt>AGENTMAIL</dt>
          <dd>{ALL_GAS.agentMail.inbox}</dd>
        </div>
      </dl>
    </article>
  )
}
