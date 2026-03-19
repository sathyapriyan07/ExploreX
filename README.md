# ExploreX — Travel Intelligence Platform (India-first)

## Quick start

1) Install deps:
   - `npm install`

2) Configure env:
   - Copy `.env.example` to `.env`
   - (Optional) Fill `UNSPLASH_ACCESS_KEY` (not currently used by the UI; kept for future gallery upgrades)
   - Optional (recommended): fill `VITE_MAPTILER_KEY` for MapTiler tiles (falls back to OSM if unset)
   - Optional: set `VITE_MAPTILER_STYLE_SATELLITE=hybrid-v4` for satellite/hybrid tiles
   - Fill `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (optional for auth + saved trips)

3) Run:
   - `npm run dev`

Frontend: `http://localhost:5173`  
Backend proxy API: `http://localhost:8787/api/*`

## Proxy endpoints

- `GET /api/wiki?place=...` (Wikipedia summary + coords)
- `GET /api/search?query=...` (MediaWiki search)
- `GET /api/nearby?lat=...&lon=...&radius=...` (Overpass POIs)
- `GET /api/weather?lat=...&lon=...` (Open-Meteo current + hourly forecast)
- `GET /api/images?query=...` (Unsplash images)
- `GET /api/place-full?place=...` (combined payload; cached)

All external calls go through the backend (keys stay server-side). Responses are cached in-memory with a 1–6 hour TTL and rate-limited per IP.

## Supabase (optional, recommended)

- SQL schema: `supabase/migrations/001_init.sql`
- Create a Supabase project, run the SQL, then set the `VITE_SUPABASE_*` vars.
