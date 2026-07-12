# MyNovaPilot — Project TODO

## Phase 1 Foundation

- [x] Design system — Tailwind config, brand colors, Inter font, global CSS
- [x] PWA manifest with iPhone install support
- [x] Five-tab navigation (Mission Control, Launch Pad, Assembly, Systems, Control Tower)
- [x] Mobile bottom tabs + tablet/desktop persistent sidebar
- [x] App routing in App.tsx
- [x] Mission Control dashboard — fleet summary hero
- [x] Mission Control dashboard — product cards with badge, score, status, actions
- [x] Mission Control dashboard — empty state for new users
- [x] Aria co-pilot floating bubble (always visible above tab bar)
- [x] Aria bottom sheet with Ask/Explain/Options actions
- [x] Nova Academy section with 7 educational topic cards
- [x] Launch Pad screen — Nova Spark free-tier idea entry form
- [x] Launch Pad screen — animated score reveal
- [x] Launch Pad screen — frosted-glass locked premium sections
- [x] Systems Check screen — systems clearance gauge
- [x] Systems Check screen — connection status list
- [x] Systems Check screen — Mission Treasury area
- [x] Control Tower screen — product health cards
- [x] Control Tower screen — status board scores and weather-warning cards
- [x] Control Tower screen — Emergency Systems Lock control
- [x] Assembly screen — launch sequence stage indicator (Mission Brief → Launch Clearance)
- [x] Authentication — sign-up and login screens
- [x] Authentication — protected routes and session management
- [x] Drizzle ORM schema — fleet_products, mission_vault, mission_leases, flight_recorder, launch_sequences, spark_missions
- [x] Framer Motion micro-interactions throughout
- [x] Vitest tests for auth and core procedures
- [x] .novacommand/manifest.json (Phase 2)
- [x] MANUS_HANDOFF.md (Phase 2)
- [x] tRPC procedures wired to real database (Phase 2)
- [x] Aria AI chat integration (Phase 3)
- [x] Nova Spark real AI scoring (Phase 2)
- [x] Mission Vault encryption (Phase 3)

## Phase 2 — Live Data & Nova Spark AI

- [x] server/db.ts — fleet product query helpers (list, create, update, archive)
- [x] server/db.ts — launch sequence query helpers (list by product, upsert stage)
- [x] server/db.ts — spark mission query helpers (create, get by user)
- [x] tRPC router: fleet.list, fleet.create, fleet.update, fleet.archive
- [x] tRPC router: launchSequence.list, launchSequence.advanceStage
- [x] tRPC router: spark.analyze (Nova Spark AI scoring via built-in LLM)
- [x] Mission Control — replace mock data with trpc.fleet.list.useQuery
- [x] Mission Control — wire "+ Brief New Mission" CTA to trpc.fleet.create
- [x] Launch Pad — wire "Run Nova Spark Analysis" to trpc.spark.analyze
- [x] Launch Pad — animated score reveal from real AI response
- [x] Assembly — wire stage list to trpc.launchSequence.list
- [x] Assembly — wire "Mark Stage Complete" to trpc.launchSequence.advanceStage
- [x] Vitest tests for fleet.list, fleet.create, spark.analyze procedures

## Language System v2 — Professional Founder Tone

- [x] Navigation labels: Dashboard, New Product, Build, Connections, Health, Settings
- [x] Status indicators: All Good, Needs Attention, Action Required
- [x] MissionLayout — update tab labels and sidebar nav labels
- [x] MissionHeader — update subtitle copy and status badge labels
- [x] Dashboard — update header, hero copy, product card copy, CTA labels
- [x] New Product (Launch Pad) — update form copy, score reveal market signal labels, premium section copy
- [x] Build (Assembly) — update stage names, progress bar labels, action button copy
- [x] Connections (Systems) — update header, setup score labels, connection status copy, Financials section
- [x] Health (Control Tower) — update header, product card copy, emergency lock label
- [x] Aria bottom sheet — updated copy, Nova Academy topic titles
- [x] Nova Academy — all 7 topic titles updated to plain English
- [x] App.tsx routes — updated to /new-product, /build, /connections, /health, /settings

## Phase 3 — Aria AI Chat & Mission Vault

### Aria AI Chat
- [x] tRPC aria.chat procedure — streaming LLM with system prompt, screen context, and conversation history
- [x] tRPC aria.explain procedure — one-shot screen explanation
- [x] AriaCopilot.tsx — replace placeholder actions with real streaming chat UI
- [x] Aria chat message history (per session, in-memory on client)
- [x] "Ask Aria anything" opens full chat interface with streaming responses
- [x] "What does this mean?" sends current screen context and streams explanation
- [x] "Show my options" sends current screen and streams available actions
- [x] Aria chat markdown rendering for responses
- [x] Aria typing indicator while streaming

### Mission Vault
- [x] Drizzle schema — mission_vault table with encrypted content fields
- [x] Server-side AES-256 encryption/decryption helpers for vault entries
- [x] tRPC vault.list procedure — list vault entries for user (metadata only, no content)
- [x] tRPC vault.create procedure — encrypt and store new vault entry
- [x] tRPC vault.get procedure — decrypt and return single vault entry
- [x] tRPC vault.update procedure — re-encrypt and update vault entry
- [x] tRPC vault.delete procedure — remove vault entry
- [x] tRPC vault.toggleLock procedure — lock/unlock vault (requires PIN)
- [x] Mission Vault page — vault list with entry type icons and lock status
- [x] Mission Vault page — add/edit entry form (title, type, content, tags)
- [x] Mission Vault page — view entry with decrypted content display
- [x] Mission Vault page — vault lock screen with PIN entry
- [x] Mission Vault page — entry types: Idea, Password, API Key, Document, Note, Contract
- [x] Connections screen — add Mission Vault link/section
- [x] Vitest tests for vault.create, vault.get (encryption round-trip)
- [x] Vitest tests for aria.chat procedure

## Landing Page — think build launch

- [x] Generate Aria character image (three-quarter body, warm studio lighting, navy background)
- [x] Landing page route at / (public, no auth required, no nav tabs)
- [x] Growing "think build launch" tagline with sequential fade-in animation (1x, 1.6x, 2.4x ratio)
- [x] Amber CTA button "Talk to Aria — it's free"
- [x] Subline: "No signup required. Takes about 8 minutes."
- [x] ElevenLabs voice agent embedded on button click (VITE_ELEVENLABS_AGENT_ID secret pending)
- [x] Desktop split layout — Aria left half, copy right half
- [x] Mobile layout — Aria top portrait, tagline below, full-width button
- [x] Below-fold: How it works (3 steps)
- [x] Below-fold: Founders say (omitted at launch — will populate with real quotes)
- [x] Below-fold: The promise (3 pricing promises)
- [x] Minimal footer: logo, copyright, Privacy Policy, Terms
- [x] App route updated so / shows landing page, /dashboard shows authenticated app
