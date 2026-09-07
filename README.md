# Fleet HUD — Klaus Drive PROCESS

Dark forensic PWA showing the Klaus Drive ring process:

**MARA** (inventory) → **COLE** (PROPOSE) → **RINA** (plates) → **VINCE** (`approve[id]` holds) → **EXECUTE** (moves).

Embedded snapshot: `src/data/processSnapshot.json` (GH Pages offline). Convex: `fleet-gerbil-682` when `VITE_CONVEX_URL` set.

Live: https://snowphamtom.github.io/fleet-hud/

```bash
npm install
npm run dev      # :5174
npm run build
npm run deploy   # gh-pages branch
```
