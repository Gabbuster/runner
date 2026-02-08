# Overview

This is a **Strava-style running tracker** built as a mobile-first Progressive Web App (PWA) optimized for Samsung Android Chrome. The app tracks outdoor runs using phone GPS, shows live run metrics (distance, pace, duration, route on a map), saves activities locally using IndexedDB, awards achievement badges, and provides voice coaching announcements at each kilometer using the Web Speech API.

The architecture follows a **local-first** design philosophy — all primary data storage uses IndexedDB on the client, with an optional Express/PostgreSQL backend for cloud sync. No user accounts are required by default.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: Wouter (lightweight alternative to React Router)
- **State/Data Fetching**: TanStack React Query for both local IndexedDB queries and optional server API calls
- **Styling**: TailwindCSS with CSS variables for theming (dark mode by default, Strava/Nike-inspired neon lime + dark palette)
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives — full component library in `client/src/components/ui/`
- **Animations**: Lightweight CSS keyframe animations (animate-fade-in, animate-slide-up) — no external animation library
- **Maps**: Leaflet + react-leaflet with CartoDB dark tiles (no API key needed)
- **Charts**: Recharts (area chart for pace trend on Statistics page)
- **Local Storage**: IndexedDB via the `idb` library (Promise-based wrapper) — defined in `client/src/lib/db.ts`
- **Voice Coaching**: Browser native `window.speechSynthesis` (Web Speech API) — implemented in `client/src/hooks/use-voice-coach.ts`
- **GPS Tracking**: Browser native `navigator.geolocation` — implemented in `client/src/hooks/use-tracker.ts`

### Key Frontend Files
- `client/src/App.tsx` — Route definitions with CSS-based transitions
- `client/src/hooks/use-tracker.ts` — Core GPS tracking logic (start/pause/resume/stop, distance calculation via Haversine formula, GPS error handling)
- `client/src/hooks/use-voice-coach.ts` — TTS announcements every kilometer with motivational quotes
- `client/src/hooks/use-runs.ts` — Local-first data hooks (CRUD + delete for runs/badges in IndexedDB, optional server sync)
- `client/src/hooks/use-gps-status.ts` — GPS signal strength indicator (good/weak/searching/unavailable)
- `client/src/lib/db.ts` — IndexedDB schema definition (runs, badges, settings stores)
- `client/src/components/Map.tsx` — Leaflet map with live route tracking and follow-user mode
- `client/src/pages/` — Home, ActiveRun, Activity, RunDetails, Statistics, Badges, Settings, NotFound

### Backend (server/)
- **Framework**: Express.js on Node with TypeScript
- **Purpose**: Minimal — only used for optional cloud sync of runs. Not required for core functionality.
- **Database**: PostgreSQL via Drizzle ORM
- **API Routes**: Defined in `shared/routes.ts` as a typed contract with Zod validation
  - `POST /api/runs/sync` — Bulk sync runs from client to server
  - `GET /api/runs` — List all server-stored runs
  - `GET /api/badges` — List all server-stored badges
- **Dev Server**: Vite dev server proxied through Express (server/vite.ts)
- **Production**: Vite builds static files to `dist/public`, Express serves them

### Shared (shared/)
- `shared/schema.ts` — Drizzle PostgreSQL table definitions (`runs`, `badges`) and Zod schemas. Also defines the `RoutePoint` type used for GPS data.
- `shared/routes.ts` — Typed API contract with Zod input/output validation

### Database Schema
Two PostgreSQL tables (also mirrored as IndexedDB stores on client):

**runs**: id, userId (optional), startTime, endTime, duration (seconds), distance (meters), route (JSONB array of RoutePoints), avgPace (min/km), status ('completed'|'discarded'), createdAt

**badges**: id, runId, badgeType ('first_run', '5k', '10k', 'early_bird', 'fast_1k'), unlockedAt

### Build System
- **Dev**: `tsx server/index.ts` runs the Express server with Vite middleware for HMR
- **Build**: Custom script (`script/build.ts`) — Vite builds the client, esbuild bundles the server
- **DB Migrations**: `drizzle-kit push` pushes schema to PostgreSQL
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`

### Design Decisions
1. **Local-first storage**: IndexedDB is the primary data store. Server sync is opt-in via Settings page. This enables offline use and eliminates mandatory accounts.
2. **Dark theme only**: The app uses a dark color scheme inspired by Nike/Strava running apps, with neon lime (#84 100% 59%) as the primary accent color.
3. **Mobile-first layout**: Max-width constrained to `max-w-md`, bottom navigation bar, touch-optimized controls.
4. **GPS tracking**: Uses ref-based state to avoid stale closures, single watchPosition instance, accuracy/distance filtering (30m accuracy, 1-80m distance threshold), user-facing error messages for permission/signal issues.

## External Dependencies

- **PostgreSQL**: Required for optional server-side sync. Connection via `DATABASE_URL` environment variable. Uses Drizzle ORM with `drizzle-kit push` for schema management.
- **OpenStreetMap / CartoDB Tiles**: Free map tiles, no API key required. Dark-themed tiles from `basemaps.cartocdn.com`.
- **Web Speech API**: Browser-native text-to-speech for voice coaching. No external service needed.
- **Geolocation API**: Browser-native GPS tracking. No external service needed.
- **Google Fonts**: Inter, Teko, JetBrains Mono loaded from fonts.googleapis.com