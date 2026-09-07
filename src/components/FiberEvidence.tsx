import type { FiberNode } from '../lib/fiber'
import {
  bucketOf,
  fiberColor,
  formatBytes,
  freshnessOf,
  residualOf,
  sizeWeight,
} from '../lib/fiber'
import { SectionLabel } from './SectionLabel'

type Props = {
  node: FiberNode | null
  onClose?: () => void
}

export function FiberEvidence({ node, onClose }: Props) {
  if (!node) return null
  const bucket = bucketOf(node)
  const residual = residualOf(node)
  const hasCS = node.claimed > 0 || node.source > 0
  const color = fiberColor(node)

  return (
    <article className="fiber-evidence-panel panel" role="status">
      <div className="fiber-evidence-head">
        <SectionLabel title="EVIDENCE" value={bucket.toUpperCase()} accent />
        {onClose ? (
          <button type="button" className="btn ghost compact" onClick={onClose}>
            close
          </button>
        ) : null}
      </div>
      <div className="fiber-evidence-swatch" style={{ background: color }} aria-hidden />
      <dl className="fiber-evidence-grid">
        <div>
          <dt>id</dt>
          <dd className="mono">{node.id}</dd>
        </div>
        <div>
          <dt>bucket</dt>
          <dd style={{ color }}>{bucket}</dd>
        </div>
        <div>
          <dt>mime</dt>
          <dd>{node.mimeKind ?? '—'}</dd>
        </div>
        <div>
          <dt>size</dt>
          <dd>
            {node.sizeBytes != null ? formatBytes(node.sizeBytes) : '—'} · w=
            {sizeWeight(node).toFixed(2)}
          </dd>
        </div>
        <div>
          <dt>age</dt>
          <dd>
            {node.mtimeAgeDays != null ? `${node.mtimeAgeDays}d` : '—'} · fresh=
            {freshnessOf(node).toFixed(2)}
          </dd>
        </div>
        {hasCS ? (
          <div>
            <dt>C ≤ S</dt>
            <dd>
              C={node.claimed} S={node.source} · residual{' '}
              {residual > 0 ? `+${residual}` : residual}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>label</dt>
          <dd className="dim">{node.label}</dd>
        </div>
      </dl>
      <p className="panel-foot">// sorted by metrics · label secondary</p>
    </article>
  )
}
