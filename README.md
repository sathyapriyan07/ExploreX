# ExploreX - Travel Intelligence Platform (India-first)

## Quick start

1) Install deps:
   - `npm install`

2) Configure env:
   - Copy `.env.example` to `.env`
   - Local dev (Fastify proxy): set `VITE_API_BASE=http://localhost:8787`
   - Deploy (Vercel): leave `VITE_API_BASE` empty to use same-origin `/api/*`
   - Optional (recommended): set `VITE_MAPTILER_KEY` (MapTiler tiles)
   - Optional: set `VITE_MAPTILER_STYLE_SATELLITE=hybrid-v4` for satellite/hybrid tiles
   - Optional: set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (auth + saved trips)

3) Run:
   - `npm run dev`

Frontend: `http://localhost:5173`  
Local proxy API: `http://localhost:8787/api/*` (Fastify)

## Proxy endpoints

- `GET /api/wiki?place=...` (Wikipedia summary + coords)
- `GET /api/search?query=...` (MediaWiki search)
- `GET /api/nearby?lat=...&lon=...&radius=...` (Overpass POIs)
- `GET /api/weather?lat=...&lon=...` (Open-Meteo current + hourly forecast)
- `GET /api/images?query=...` (currently disabled; UI uses Wikipedia images)
- `GET /api/place-full?place=...` (combined payload; cached)

All external calls go through `/api/*`. Responses are cached in-memory (best-effort on warm instances) and rate-limited per IP.

## Deploy on Vercel (single deploy)

1) Create a Vercel project from this repo.
2) Keep defaults (repo root). `vercel.json` sets build/output + SPA rewrites.
3) Add env vars (Vercel Project -> Settings -> Environment Variables):
   - `VITE_MAPTILER_KEY` (required for MapTiler tiles)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (optional)
4) Deploy. The app uses same-origin serverless routes: `/api/wiki`, `/api/nearby`, etc.

## Supabase (optional, recommended)

- SQL schema: `supabase/migrations/001_init.sql`
- Create a Supabase project, run the SQL, then set the `VITE_SUPABASE_*` vars.
