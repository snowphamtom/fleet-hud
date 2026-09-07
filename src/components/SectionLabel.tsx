type Props = {
  title: string
  value?: string | number
  accent?: boolean
}

export function SectionLabel({ title, value, accent }: Props) {
  return (
    <div className={`section-label ${accent ? 'accent' : ''}`}>
      <span className="section-title">// {title}</span>
      {value !== undefined && <span className="section-value">{value}</span>}
    </div>
  )
}
