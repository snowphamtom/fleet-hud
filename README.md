# Fleet HUD — Klaus Drive PROCESS

Dark forensic PWA showing the Klaus Drive ring process:

**MARA** (inventory) → **COLE** (PROPOSE) → **RINA** (plates) → **VINCE** (`approve[id]` holds) → **EXECUTE** (moves).

- Live: Convex `processRing:getLatest` on `fleet-gerbil-682` (continuous subscribe).
- Fallback: embedded `src/data/processSnapshot.json` when offline / loading.
- Sync state → Convex: `/workspace/allgas-convex/scripts/syncProcessRing.mjs` (Heavy will add @every 15m weekday).

Live: https://snowphamtom.github.io/fleet-hud/

```bash
npm install
npm run dev      # :5174
npm run build
npm run deploy   # gh-pages branch
```
