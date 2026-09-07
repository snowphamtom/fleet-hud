/** All Gas stack — Convex URL from VITE_*; Heavy owns fleet-gerbil-682. */
const PLACEHOLDER_CLOUD = 'https://YOUR_DEPLOYMENT.convex.cloud'
const PLACEHOLDER_SITE = 'https://YOUR_DEPLOYMENT.convex.site'

function envOr(key: keyof ImportMetaEnv, fallback: string): string {
  const v = import.meta.env[key]
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

function isPlaceholder(url: string): boolean {
  return !url || url.includes('YOUR_DEPLOYMENT') || url.includes('placeholder')
}

export const ALL_GAS = {
  convex: {
    url: envOr('VITE_CONVEX_URL', PLACEHOLDER_CLOUD),
    site: envOr('VITE_CONVEX_SITE', PLACEHOLDER_SITE),
    /** True when VITE_CONVEX_URL points at a real deployment */
    configured: !isPlaceholder(envOr('VITE_CONVEX_URL', PLACEHOLDER_CLOUD)),
  },
  firecrawl: {
    apiBase: envOr('VITE_FIRECRAWL_URL', 'https://api.firecrawl.dev/v1'),
    stub: true,
  },
  agentMail: {
    inbox: envOr('VITE_AGENTMAIL_INBOX', 'inbox@example.agentmail.to'),
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
