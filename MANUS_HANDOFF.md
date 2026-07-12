# MyNovaPilot — Manus Build Handoff

**Build Phase:** Phase 2 — Live Data & Nova Spark AI  
**Date:** 2026-07-09  
**Status:** Production-ready for Phase 2 scope

---

## What Has Been Built

MyNovaPilot is a mobile-first PWA for startup and idea management. Founders use it to track, launch, and manage digital products through a mission-control metaphor — from raw idea to market-ready product.

### Phase 1 — Foundation (Complete)

| Area | What Was Built |
|---|---|
| Design System | Navy `#1a274d` / Amber `#f59e0b` / Teal `#0d9488` brand palette, Inter font, Tailwind 4 custom tokens, frosted-glass utilities |
| PWA | `manifest.json` with iPhone install support, Apple touch meta tags, theme color |
| Navigation | Five-tab bottom nav (mobile) + persistent sidebar (tablet/desktop): Mission Control, Launch Pad, Assembly, Systems, Control Tower |
| Mission Control | Fleet summary hero, product cards (name, domain, badge, score, status, last activity), empty state for new users |
| Aria Co-pilot | Floating amber bubble always visible above tab bar, expandable bottom sheet with "Ask Aria anything", "Explain this screen", "Show my options", Nova Academy with 7 topic cards |
| Launch Pad | Nova Spark idea entry form (free tier), animated score reveal, frosted-glass locked premium sections (Competitor Intelligence, Revenue Modelling, Domain & Brand Scout) |
| Assembly | Launch sequence stage indicator — Mission Brief → Nova Spark → Systems Check → Assembly → Launch Clearance |
| Systems | Clearance gauge with animated ring, system connections list, Mission Vault UI, Mission Treasury |
| Control Tower | Product health cards, fleet overview strip, Emergency Systems Lock with confirmation |
| Auth | Manus OAuth login/signup screens, protected routes, session management |
| Database | Drizzle ORM schema: `users`, `fleet_products`, `mission_vault`, `mission_leases`, `flight_recorder`, `launch_sequences`, `spark_missions` |

### Phase 2 — Live Data & Nova Spark AI (Complete)

| Area | What Was Built |
|---|---|
| Fleet tRPC Router | `fleet.list`, `fleet.create`, `fleet.update`, `fleet.archive` — all protected, user-scoped |
| Launch Sequence Router | `launchSequence.list` (synthesises all 5 stages with DB status), `launchSequence.startStage`, `launchSequence.advanceStage` (upsert-safe) |
| Nova Spark AI Router | `spark.analyze` — calls built-in LLM with structured JSON schema output, returns `sparkScore`, `scoreLabel`, `marketClarity`, `problemFit`, `audienceDefinition`, `summary`, `strengths`, `risks`, `nextStep`, `missionBadge`, `clearanceStatus` |
| Mission Control | Wired to `trpc.fleet.list.useQuery`, "Brief New Mission" modal wired to `trpc.fleet.create` |
| Launch Pad | Wired to `trpc.spark.analyze.useMutation`, animated score reveal from real AI response, strengths/risks/next-step display |
| Assembly | Product selector, stage list from `trpc.launchSequence.list`, "Mark Stage Complete" wired to `trpc.launchSequence.advanceStage` |
| Tests | 8 vitest tests passing (auth logout, fleet.list, fleet.create, fleet.archive, spark.analyze, launchSequence.list) |

---

## What Is Planned for Phase 3

- **Aria AI Chat Integration** — wire the Aria co-pilot bottom sheet to the built-in LLM for real contextual answers
- **Mission Vault Encryption** — AES-256 key storage for domain credentials, API keys, and payment gateway secrets
- **Control Tower Live Data** — wire health cards and status board scores to real fleet product data
- **Systems Live Data** — wire clearance gauge and connection status to real integrations
- **Nova Pro Premium Features** — Competitor Intelligence, Revenue Modelling, Domain & Brand Scout

---

## Key Files

```
client/src/pages/
  MissionControl.tsx     ← Fleet dashboard, product cards, Brief New Mission modal
  LaunchPad.tsx          ← Nova Spark form + AI score reveal
  Assembly.tsx           ← Launch sequence stage tracker
  Systems.tsx            ← Clearance gauge, connections, vault, treasury
  ControlTower.tsx       ← Product health monitoring, emergency lock
  Login.tsx              ← Manus OAuth sign-in screen
  FlightDeck.tsx         ← User profile and settings

client/src/components/
  MissionLayout.tsx      ← Five-tab nav + sidebar layout wrapper
  MissionHeader.tsx      ← Screen header with clearance badge
  AriaCopilot.tsx        ← Floating bubble + bottom sheet + Nova Academy

server/routers/
  fleet.ts               ← Fleet product CRUD procedures
  launchSequence.ts      ← Launch stage tracking procedures
  spark.ts               ← Nova Spark AI scoring procedure

drizzle/schema.ts        ← All 7 database tables
server/db.ts             ← All database query helpers
```

---

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--navy` | `#1a274d` | Primary background, sidebar |
| `--amber` | `#f59e0b` | CTAs, active states, Aria bubble |
| `--teal` | `#0d9488` | Secondary accents, teal badges |
| `--orbit-green` | `#22c55e` | Clear Skies status, completion |
| `--simulator-blue` | `#3b82f6` | Info states, simulator badges |

---

## Running Locally

```bash
pnpm install
pnpm dev          # starts Express + Vite on port 3000
pnpm test         # runs vitest suite
pnpm drizzle-kit generate  # generates migration SQL from schema changes
```

---

## Environment Variables (Auto-Injected by Manus)

- `DATABASE_URL` — MySQL/TiDB connection string
- `JWT_SECRET` — Session cookie signing
- `BUILT_IN_FORGE_API_KEY` / `BUILT_IN_FORGE_API_URL` — Manus LLM and storage APIs
- `VITE_APP_ID` / `OAUTH_SERVER_URL` / `VITE_OAUTH_PORTAL_URL` — Manus OAuth

No `.env` file is needed — all secrets are injected at runtime.
