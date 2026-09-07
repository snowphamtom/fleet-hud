/** All Gas stack stubs — URLs/config only (no quirky-rhinoceros attach). */
export const ALL_GAS = {
  convex: {
    url: import.meta.env.VITE_CONVEX_URL ?? 'https://YOUR_DEPLOYMENT.convex.cloud',
    site: import.meta.env.VITE_CONVEX_SITE ?? 'https://YOUR_DEPLOYMENT.convex.site',
  },
  firecrawl: {
    apiBase: import.meta.env.VITE_FIRECRAWL_URL ?? 'https://api.firecrawl.dev/v1',
    stub: true,
  },
  agentMail: {
    inbox: import.meta.env.VITE_AGENTMAIL_INBOX ?? 'intake@example.agentmail.to',
    stub: true,
  },
  grok: {
    model: 'grok-stub',
    panel: 'Agent logic panel — wire xAI later',
  },
  card: 'https://vibeapps.dev/s/ceilinggate-1',
} as const

export const STAGES = [
  'Intake',
  'Filter',
  'Evidence',
  'Verdict',
  'Store',
] as const

export type Stage = (typeof STAGES)[number]
