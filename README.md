# MindTrack — Mood & Wellness Dashboard

A privacy-first mood tracker that combines daily mood logging, habit tracking, AI-supported
check-ins, and safety monitoring for sustained low mood or anxiety patterns.

## Stack

- **Frontend:** React 18, Vite 7, Wouter (hash router), TanStack Query, Recharts, Tailwind 3, Radix UI
- **Backend:** Express 5, Drizzle ORM, better-sqlite3, Zod
- **Build:** esbuild (server) + Vite (client), single `npm run build`
- **Deploy:** Vercel serverless functions (Node 22) with SQLite in `/tmp`

## Features

| Page | What it does |
|---|---|
| **Dashboard** (`#/`) | Safety check alert banner, average mood / anxiety stats, 30-day mood & anxiety trend chart, habit streaks, recent mood entries |
| **Mood Log** (`#/mood`) | Daily entry form with emoji selectors for mood / energy / anxiety / sleep, 8 anxiety marker chips, free-form notes |
| **Habits** (`#/habits`) | Add habits with weekly targets, daily check-off grid, current / best streaks |
| **AI Support** (`#/ai-support`) | Configure check-in routines (Supportive / Grounding / Journaling / Coping) with custom prompts and preview |
| **Settings** (`#/settings`) | Safety thresholds, anxiety marker frequency, crisis contact, monitor enable/disable |

## Local development

```bash
npm install
npm run dev          # serves on http://localhost:5000 with hot reload
```

The app seeds a 28-day demo dataset on first request via `POST /api/seed` or automatically
when the database is empty.

## Production build

```bash
npm run build        # client → dist/public/, server → dist/index.cjs
npm start            # runs the production server from dist/index.cjs
```

## Deployment (Vercel)

The repo is configured for Vercel out of the box:

- `vercel.json` builds with `npm run build`, outputs the static client to `dist/public`,
  and routes `/api/*` to the serverless function at `api/index.ts`.
- `DATA_DIR=/tmp` (set in `vercel.json`) tells `server/db.ts` to write the SQLite file to the
  writable serverless temp directory.
- `api/index.ts` calls `seedDemoData()` on every cold start so the demo data is regenerated
  when the function wakes.

> **Note on persistence:** serverless filesystems are ephemeral. Each cold start wipes writes
> made in the previous run. The seed re-runs idempotently to keep the demo populated, but this
> is not a production-grade data store. Swap SQLite for Vercel Postgres / Turso / libSQL for
> real persistence.

## Project layout

```
api/                # Vercel serverless function entry (re-exports the Express app)
client/             # React + Vite frontend
  src/
    pages/          # Dashboard, MoodLog, Habits, AISupport, Settings
    components/     # shadcn/ui primitives + app-specific layout
server/             # Express app, routes, storage, Drizzle schema bootstrap
shared/             # Drizzle schema + Zod validators (used by both sides)
script/build.ts     # esbuild + Vite production build
vercel.json         # Vercel config
```

## Safety note

This app is a personal wellness tool, **not** a medical device. The "988 Crisis Line" button
is shown when safety alerts fire; the wording in `server/routes.ts:159-178` reinforces that
alerts are invitations to connect with a professional, not diagnoses.