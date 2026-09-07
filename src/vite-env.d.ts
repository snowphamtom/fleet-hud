/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string
  readonly VITE_CONVEX_SITE?: string
  readonly VITE_FIRECRAWL_URL?: string
  readonly VITE_AGENTMAIL_INBOX?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
