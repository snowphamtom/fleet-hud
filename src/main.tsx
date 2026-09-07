import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import { ALL_GAS } from './lib/config'
import './index.css'

registerSW({ immediate: true })

const root = createRoot(document.getElementById('root')!)

if (ALL_GAS.convex.configured) {
  const client = new ConvexReactClient(ALL_GAS.convex.url)
  root.render(
    <StrictMode>
      <ConvexProvider client={client}>
        <App />
      </ConvexProvider>
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
