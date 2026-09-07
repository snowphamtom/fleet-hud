# Fleet HUD — Sorting Machine (PWA)

Phone-first installable Progressive Web App shell for Taylor’s fleet HUD / sorting machine.

**Law:** `C ≤ S` componentwise → **GRANT** / **REFUSE**.

Stages: Intake → Filter → Evidence → Verdict → Store.

This is a **new** Vite + React + TypeScript app at `/workspace/fleet-hud`. It is **not** bolted onto CeilingGate / StoryForge.

## Features (first cut)

- Installable PWA (`vite-plugin-pwa` + manifest + service worker)
- Top HUD bar + live-feeling stage panels (client sim timers)
- Demo GRANT / Demo REFUSE → ledger lines with `C≤S` chips (real click → state)
- Optional dendrite / ring SVG (sort core)
- Grok / Convex / Firecrawl / AgentMail **stubs** (config URLs only — no Convex attach)
- Card chip → [https://vibeapps.dev/s/ceilinggate-1](https://vibeapps.dev/s/ceilinggate-1)

## Design tokens (light FUI)

```
--bg #f7f9fc · --ink #0b1220 · --cyan #00c2ff · --violet #7a3dff
--grant #00a86b · --refuse #e11d48 · // SECTION labels · GRANT/REFUSE stamps
```

## Run locally

```bash
cd fleet-hud
npm install
npm run dev
```

Dev server: **http://127.0.0.1:5174/** (port **5174** — leaves AppForge on `:5173` alone).

Phone on same network: use the LAN URL Vite prints, or tunnel.

```bash
npm run build
npm run preview   # http://127.0.0.1:4174/fleet-hud/
```

## Deploy (GitHub Pages)

Repo: `snowphamtom/fleet-hud`  
Live: **https://snowphamtom.github.io/fleet-hud/**

```bash
npm run build
npm run deploy    # gh-pages → branch gh-pages
```

Vite `base` is `/fleet-hud/` for project Pages.

### Add to Home Screen

1. Open the Pages URL on your phone.
2. **iOS Safari:** Share → **Add to Home Screen**.
3. **Android Chrome:** Menu ⋮ → **Install app** / **Add to Home screen**.
4. **Desktop Chrome:** install icon in the address bar when offered.

## Env stubs (optional)

```bash
VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
VITE_CONVEX_SITE=https://YOUR_DEPLOYMENT.convex.site
VITE_FIRECRAWL_URL=https://api.firecrawl.dev/v1
VITE_AGENTMAIL_INBOX=intake@example.agentmail.to
```

Do **not** point this shell at CeilingGate’s live Convex (`quirky-rhinoceros-*`) unless MANAGER explicitly re-attaches later.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite on :5174 |
| `npm run build` | `tsc -b && vite build` |
| `npm run preview` | Preview dist on :4174 |
| `npm run deploy` | Publish `dist` to `gh-pages` |

## Fences

OFF PHONE · no fake $ · HOLD FILE on vibeapps · prefer-live · card = ceilinggate-1
