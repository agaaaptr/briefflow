# Briefflow

Client brief intake + AI triage for a sales team: a public form collects project
briefs, an LLM summarizes and prioritizes each one into validated JSON, and an
admin-only dashboard manages them through a sales pipeline
(New → Contacted → Proposal → Won / Lost).

**Live demo:** `<URL — added after deploy>` · admin credentials are sent by email
(they are intentionally not stored in this repo).

## Tech stack

| Layer | Choice | Version |
| --- | --- | --- |
| Framework | Next.js (App Router, TypeScript, Turbopack) | 16.4.6 |
| Database | PostgreSQL (Neon in prod, Docker Postgres locally) | 17 |
| ORM | Prisma (driver adapters: `pg` local / `neon` prod) | 7.10.1 |
| Validation | Zod (one shared schema for form + AI output) | 4.6.7 |
| AI | Google Gemini via `@google/genai` + deterministic mock fallback | genai 3.6.0 · `gemini-3.8-flash` |
| Auth | iron-session (signed cookie) + bcryptjs (hash in env) | 9.1.0 / 3.0.3 |
| Styling | Tailwind CSS (plain components — no component library) | 4.3.3 |
| Tests | Vitest (23 tests) + HTTP smoke scripts | 5.1.1 |

Node >= 22.13 is required (`iron-session` engine constraint; local dev used Node 24).

## Run locally

### With Docker (recommended)

```bash
cp .env.example .env          # then fill ADMIN_PASSWORD_HASH + SESSION_SECRET (see table below)
docker compose up --build     # postgres + one-shot migrate + app on http://localhost:3000
```

### Manual

```bash
docker compose up -d db            # or any PostgreSQL 17
cp .env.example .env               # set DATABASE_URL to your local Postgres
npm install
npx prisma migrate dev             # applies schema, generates client
npm run dev                        # http://localhost:3000
```

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | App connection. Prod: Neon **pooled** URL. Local: `postgresql://briefflow:briefflow@localhost:5432/briefflow` |
| `DATABASE_URL_DIRECT` | prod only | Neon direct (non-pooled) URL, used solely for `prisma migrate deploy` |
| `GEMINI_API_KEY` | for real AI | From aistudio.google.com. Empty + `AI_PROVIDER=gemini` → briefs fail honestly |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.8-flash` |
| `AI_PROVIDER` | yes | `gemini` \| `mock`. `mock` = deterministic offline provider (dev/test) |
| `ADMIN_EMAIL` | yes | The single admin login |
| `ADMIN_PASSWORD_HASH` | yes | bcrypt: `node -e "console.log(require('bcryptjs').hashSync('pw',10))"` |
| `SESSION_SECRET` | yes | >= 32 chars: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## Architecture

```
Public form (/, client component)
  │  POST /api/briefs                ← Route Handler: Zod validation + rate limit
  ▼
Brief row (aiStatus=PENDING) ──201 {id}──► user sees success immediately
  │
  └─ after() ─► processBrief(id): aiStatus=PROCESSING
        └─ generateBriefSummary()
             ├─ Gemini generateContent(responseSchema) ──► aiResultSchema.safeParse()
             ├─ invalid → 1 repair retry with the validator error as feedback
             ├─ 429/quota → deterministic mock (marked provider:"mock", noted)
             └─ else → aiStatus=FAILED + aiError (re-processable from dashboard)
        └─ write aiResult JSON + promoted aiCategory/aiPriority columns

Dashboard (login-gated)
  ├─ list: server-side filters ?priority=&category= (combinable), createdAt DESC
  ├─ detail: raw form data + AI result + "Proses ulang AI" + pipeline select
  └─ draft email: LLM writes an Indonesian reply draft (copy button)
```

**Why this shape:** the form must not wait for the LLM, so processing runs in
`after()` (post-response, same function budget). No queue service — one LLM call
per brief does not justify QStash/Inngest, and a stuck row is always recoverable
via the re-process button (`aiAttempts`/`updatedAt` make stale rows visible).

### Data model (single table)

`Brief`: `id` (cuid), `name`, `email`, `company`, `needs` (text), `budget`
(enum: 5 IDR ranges), `targetTimeline` (date, must be >= today), `pipelineStatus`
(enum NEW/CONTACTED/PROPOSAL/WON/LOST), `aiStatus` (enum PENDING/PROCESSING/
SUCCESS/FAILED), `aiCategory` + `aiPriority` (nullable enums — promoted from the
AI result for filtering/sorting), `aiResult` (jsonb: full validated payload +
`provider`/`model` honesty metadata), `aiError`, `aiAttempts`, `aiProcessedAt`,
`createdAt`, `updatedAt`. Indexes on `createdAt`, `(aiCategory, aiPriority)`,
`pipelineStatus`. No user table — a single admin comes from env.

## API

| Endpoint / action | Auth | Contract |
| --- | --- | --- |
| `POST /api/briefs` | public (rate-limited 5/10s/IP) | Valid → `201 {id}` · invalid → `400 {error, fieldErrors}` · flooded → `429` |
| `login` / `logout` | — | Server Actions (CSRF-safe by origin check) |
| `reprocessBrief(id)` | admin session | sets PROCESSING, runs LLM via `after()`, revalidates |
| `setPipeline(id, status)` | admin session | validates enum, persists, revalidates |
| `draftEmail(id)` | admin session | requires aiStatus=SUCCESS, returns draft text |

## AI integration

- **Provider:** Google Gemini (`gemini-3.8-flash`, free tier) via `@google/genai`
  with `responseMimeType: "application/json"` + a hand-written OpenAPI-subset
  `responseSchema`. **Mock:** deterministic keyword/budget/timeline-based
  provider used (1) in dev/tests to burn zero quota and (2) live when Gemini
  answers 429/quota-exhausted — always recorded as `provider: "mock"` in
  `aiResult`, so the data never lies about its origin.
- **Validation in code:** every payload goes through `aiResultSchema.safeParse()`
  (Zod). A failed parse triggers exactly one repair retry that feeds the
  validator error back to the model; a second failure marks the brief `FAILED`
  with the error stored — re-processable from the dashboard.
- **Timeout:** `AbortSignal.timeout(30_000)` per call, well under the route's
  `maxDuration = 60`.
- **Schema guarantee:** the Gemini `responseSchema` enums are built from the
  same constants as the Zod schema, and a test asserts they stay identical.

### The prompt (verbatim, `src/lib/ai/prompt.ts`)

> Anda adalah asisten triase brief untuk agensi kreatif. Tugas Anda membaca
> brief calon klien lalu menghasilkan ringkasan, kategori layanan, prioritas,
> alasan prioritas, dan daftar informasi yang masih kurang.
>
> Aturan output:
> - Output HANYA JSON valid sesuai schema — tanpa teks lain, tanpa markdown fence.
> - "service_category" wajib salah satu dari: "Branding", "Website", "Mobile App",
>   "AI Automation", "Social Media", "Lainnya".
> - "priority" wajib salah satu dari: "High", "Medium", "Low".
> - Semua teks ditulis dalam Bahasa Indonesia.
> - "summary": ringkasan 1-2 kalimat.
> - "priority_reason": alasan singkat 1 kalimat (pertimbangkan nilai budget,
>   urgensi timeline, dan kejelasan kebutuhan).
> - "missing_info": array of string — informasi penting yang belum disebut brief;
>   kosongkan [] jika sudah lengkap.
>
> (diikuti satu contoh output JSON lengkap — lihat source)

The user prompt appends the brief's needs/budget/timeline in Indonesian.

## Security

- Single admin from env (`ADMIN_EMAIL` + bcrypt `ADMIN_PASSWORD_HASH`) — no
  password in code or repo; hash generated once with cost 10.
- Session: iron-session signed+encrypted cookie — `httpOnly`, `sameSite=lax`,
  `secure` in production, 7-day TTL, secret from env.
- Two-layer guard: `proxy.ts` redirects `/dashboard/*` without a session cookie;
  `requireAuth()` is the authoritative check in the dashboard layout **and**
  every mutating Server Action.
- Public endpoint is a trust boundary: server-side Zod validation on all six
  fields (client-side checks are UX only) + per-IP rate limit (5 req / 10 s).
- Secrets only in `.env` (gitignored; `.env.example` has placeholders).
  `noir-debt:` the rate-limit map is per-serverless-instance — fine for the
  rubric's "basic rate limit", not a global guarantee.

## Testing

```bash
npm test          # 23 vitest tests (offline, no API key, mocked Prisma)
npm run build     # typecheck + prisma generate + production build
node scripts/smoke-api.mjs        # HTTP contract of POST /api/briefs (server must run)
node scripts/fetch-dashboard.mjs  # auth + filters + detail (server must run)
```

Covered: AI schema accepts/rejects (incl. Gemini-schema ↔ Zod-enum identity),
server-side 400 cases, `processBrief` success/failed/quota-fallback/missing-row,
filter parsing and query shape (combined + single + unknown values).

## Deployment (Vercel + Neon)

1. Neon project (region Singapore) → copy **pooled** URL (`DATABASE_URL`) and
   **direct** URL (`DATABASE_URL_DIRECT`).
2. `npx prisma migrate deploy` locally against the direct URL (idempotent —
   safe on every deploy; never `db push` in prod).
3. Vercel: import repo, set all env vars, region `sin1` (co-located with Neon).
   Build runs `prisma generate && next build` (the generated client is
   gitignored). First click after idle may take 1–5 s (Hobby cold start +
   Neon scale-to-zero) — normal.
4. Smoke test the live URL: submit form → summary appears → login → filter →
   re-process.

## Decisions & trade-offs

- **One shared Zod schema** for the form and the AI output keeps validation in a
  single place (rubric: "SATU schema bersama").
- **Hybrid storage**: promoted typed columns for filter/sort + full jsonb payload
  for honesty/auditability.
- **Route Handler for the public API** (explicit status codes, JSON contract —
  "API rapi"), **Server Actions for internal mutations** (CSRF built in,
  `revalidatePath`).
- **`after()` instead of a queue**: one 3–15 s LLM call per brief; a queue
  service would be the over-engineering that take-homes get rejected for.
- **Plain Tailwind components** instead of shadcn/ui — a table, two selects and
  badges don't justify a component library + registry.
- **2 s polling** (`router.refresh()`) instead of SWR/websockets while a brief
  is PENDING/PROCESSING — good enough, zero dependencies.
- **Prisma over Drizzle** (locked pre-build decision): familiar + migrations;
  costs ~1.5 s cold start vs Drizzle on serverless.
- **Gemini free tier + mock fallback** (locked): zero cost, and the fallback
  keeps the live demo alive if the daily quota is exhausted — the fallback is
  always visible in the data (`provider: "mock"` + note), never silently passed
  off as Gemini output.

## Known limitations / with more time

- Rate limit is per-instance (see `noir-debt` marker) — Upstash Redis for global.
- No pagination on the dashboard list (fine for MVP volume; index on `createdAt`
  keeps the query cheap).
- `missing_info` quality depends on the model; the mock provider is deliberately
  naive (keyword regex) and never claims otherwise.
- Draft emails are generated on demand and not persisted (no audit trail).
- Single admin only — roles/teams were explicitly out of scope.

## AI usage log

The full log lives in [`docs/ai-usage-log.md`](docs/ai-usage-log.md) (format:
Tool / Asked for / Accepted / **Changed** / **Verified**). Highlights of moments
where AI output was corrected or rejected:

1. Research claimed `gemini-2.5-flash` as the free-tier model; verification
   against aistudio.google.com showed it is deprecated — switched to
   `gemini-3.8-flash` before any code was written.
2. The AI-generated dashboard layout used `LayoutProps<"/dashboard">`, which
   fails this Next version's type constraint — replaced with an explicit
   `React.ReactNode` prop type.
3. The mock classifier matched "WhatsApp" as *Mobile App* (substring `app`) —
   fixed with a word-boundary regex and kept as a regression note.
4. `z.toJSONSchema()` as a Zod→Gemini bridge was proposed and **rejected** as
   unverified; the response schema is hand-written from shared constants with a
   test pinning the enums.

## Time spent

Planning (requirements decomposition, 8-topic web research, architecture):
~2 h AI-assisted. Build (scaffold → deploy-ready, tests, Docker): ~4 h
AI-assisted (Claude Code, model Transformer). Recording + README polish: ~1 h.
