# Briefflow — Design & Implementation Plan

> Internal sales tool: **Client Brief Intake + AI Summary**. Public form → LLM
> ringkasan/prioritas → dashboard internal untuk tim sales.
>
> Konteks: technical test **Fugo Creative** (Fullstack Developer, AI-Augmented).
> Deadline **Kamis, 19 November 2026 09.00 WIB** (besok pagi).
> Dokumen ini adalah satu-satunya sumber keputusan untuk sesi build berikutnya.

---

## 1. Intent & why

Tim sales Fugo menerima banyak brief via email/WhatsApp dan butuh satu tempat untuk
mengumpulkan brief + langsung melihat ringkasan & prioritas tanpa membaca satu per
satu. Yang kita bangun: MVP internal tool-nya.

## 2. Keputusan terkunci (dari diskusi)

| Aspek | Keputusan |
| --- | --- |
| Stack | Next.js (App Router) + TypeScript + **Prisma** + PostgreSQL |
| Deploy | **Vercel** (app) + **Neon** (Postgres), keduanya free tier |
| LLM provider | **Google Gemini (free tier)** sebagai primary, **deterministic mock** sebagai fallback |
| Bahasa | UI & summary AI = **Bahasa Indonesia**; README & video = **English** |
| Budget ranges | IDR 5 rentang: `<10jt`, `10–25jt`, `25–50jt`, `50–100jt`, `>100jt` |
| Scope | 8+ jam → semua fitur wajib + semua bonus (Docker, test, async, draft-email) |
| Repo | GitHub **public**, user `agaaaptr`, nama repo `briefflow` |
| Nama app | **Briefflow** (general; menggambarkan alur brief: intake → AI → pipeline) |

## 3. Non-goals / anti-goals

- **Anti-goal:** over-engineering. Satu monorepo, satu tabel utama, satu schema
  validasi bersama. Tidak ada microservice, event bus, worker queue, atau service
  terpisah (riset menegaskan ini penyebab utama penolakan take-home).
- **Non-goals:** multi-tenant, registrasi user, role/permission selain satu admin,
  i18n, editor rich-text, upload attachment.
- **Anti-goal:** fitur tak diminta yang setengah jadi. Lebih baik 3 "cuts" jujur
  dicatat di README/video daripada fitur ekstra yang rusak.

## 4. Arsitektur

```
briefflow/
  app/
    page.tsx                 # public form (landing)
    terima-kasih/page.tsx    # success page (opsional) / atau state di form
    api/briefs/route.ts      # POST /api/briefs (public, "API rapi" yang dinilai)
    login/page.tsx           # form login admin
    (dashboard)/
      layout.tsx             # requireAuth() gate (authoritative)
      page.tsx               # list + filter prioritas/kategori
      briefs/[id]/page.tsx   # detail + re-process + pipeline + draft email
    actions.ts               # 'use server': login, re-process, pipeline, draft email
  lib/
    db.ts                    # PrismaClient singleton
    schema.ts                # Zod: briefSchema (form) + aiResultSchema (output LLM)
    briefs.ts                # service: create, list (filter), get, setPipeline
    ai/
      index.ts               # generateBriefSummary() — orchestrator (retry + timeout)
      gemini.ts              # provider Gemini (responseSchema) → raw object
      mock.ts                # deterministic mock fallback
      prompt.ts              # system prompt (teks jelas, enum inline)
    auth.ts                  # iron-session: getSession(), requireAuth()
  components/                # form, table, filters, status badge, buttons
  prisma/schema.prisma
  tests/                     # vitest
  docker-compose.yml
  Dockerfile
  vercel.json                # region sin1, maxDuration
  .env.example
```

**Alur data utama:**
```
Public form → POST /api/briefs (Zod validasi)
  → insert Brief { aiStatus: PENDING }
  → after(() => processBrief(id))     # async, form tidak menunggu LLM
  → 201 { id }

processBrief(id):
  aiStatus = PROCESSING
  generateBriefSummary(needs, budget, timeline)
    → Gemini responseSchema → aiResultSchema.safeParse()
    → valid?  aiStatus=SUCCESS, simpan aiResult + aiCategory + aiPriority
    → invalid/timeout/429? retry 1x dengan feedback error → masih gagal?
         → fallback ke mock (jika gemini) → SUCCESS(provider=mock)
         → atau aiStatus=FAILED + aiError
```

> Kunci: `aiResult` disimpan sebagai JSON penuh; `aiCategory` & `aiPriority`
> dipromosikan jadi kolom typed untuk filter/sort (hybrid storage — lihat riset).

## 5. Data model (Prisma)

```prisma
enum PipelineStatus { NEW CONTACTED PROPOSAL WON LOST }
enum AiStatus      { PENDING PROCESSING SUCCESS FAILED }
enum BudgetRange   { UNDER_10M M10_25M M25_50M M50_100M OVER_100M }
enum ServiceCategory { BRANDING WEBSITE MOBILE_APP AI_AUTOMATION SOCIAL_MEDIA LAINNYA }
enum Priority      { HIGH MEDIUM LOW }

model Brief {
  id             String          @id @default(cuid())
  name           String
  email          String
  company        String
  needs          String          @db.Text
  budget         BudgetRange
  targetTimeline DateTime        @db.Date
  pipelineStatus PipelineStatus  @default(NEW)
  aiStatus       AiStatus        @default(PENDING)
  aiCategory     ServiceCategory?
  aiPriority     Priority?
  aiResult       Json?           // { summary, priority_reason, missing_info, provider, model }
  aiError        String?         @db.Text
  aiAttempts     Int             @default(0)
  aiProcessedAt  DateTime?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([createdAt])
  @@index([aiCategory, aiPriority])
  @@index([pipelineStatus])
}
```

- Tidak ada tabel user: satu admin dari env (`ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`).
- `aiResult Json` menyimpan payload penuh + metadata provider/model (jujur soal mock).

## 6. API surface

| Endpoint / action | Tipe | Aksi |
| --- | --- | --- |
| `POST /api/briefs` | Route Handler (public) | Validasi Zod → insert → `after()` → `201 {id}` / `400 {fieldErrors}` |
| login | Server Action | `bcrypt.compare` + set session (CSRF built-in) |
| re-process AI | Server Action | set `PROCESSING` → `processBrief(id)` → revalidate |
| update pipeline | Server Action | set `pipelineStatus` → revalidate |
| draft email | Server Action | LLM → draft balasan → tampil + copy |

- Publikasi form lewat **Route Handler** (eksplisit, status code, JSON) = poin "API rapi".
- Semua mutasi internal lewat **Server Action** (dapat CSRF bawaan Next, `revalidatePath`).
- `revalidatePath()` dipanggil **sebelum** `redirect()`.
- Rate limit dasar di `POST /api/briefs`: throttle in-memory per-IP (Map + window ~10s/5 req),
  0 dependency baru — memenuhi poin rubrik "basic rate limit" (research §8).
  `noir-debt:` per-instance saja di serverless (tidak persist antar lambda); upgrade ke
  Upstash Redis jika butuh limit global.

## 7. AI integration (nilai 15)

- **Schema output LLM (Zod, di `lib/schema.ts`):**
  ```ts
  const aiResultSchema = z.object({
    summary:          z.string().min(1),
    service_category: z.enum(['Branding','Website','Mobile App','AI Automation','Social Media','Lainnya']),
    priority:         z.enum(['High','Medium','Low']),
    priority_reason:  z.string().min(1),
    missing_info:     z.array(z.string()),
  })
  ```
- **Prompt** (`lib/ai/prompt.ts`): role "brief triage assistant untuk creative agency",
  enum value ditulis eksplisit, aturan "Output ONLY valid JSON", satu contoh lengkap,
  instruksi bahasa: "input berbahasa Indonesia → ringkas dalam Bahasa Indonesia".
  Prompt ditampilkan utuh di README (rubrik menilai "clear prompt").
- **Validasi di kode:** hasil Gemini di-`safeParse` terhadap `aiResultSchema` — bukan
  sekadar percaya string. Ini yang dinilai.
- **Retry & timeout:** `AbortSignal.timeout(30_000)`; max 2 attempt (initial + 1 repair
  dengan pesan error validasi), lalu gagal.
- **Mock fallback (`lib/ai/mock.ts`):** deterministik dari input (keyword → kategori,
  budget+timeline → prioritas). Dipakai: (1) saat dev/test agar 0 kuota terbakar,
  (2) saat live kena 429/kuota habis. Output ditandai `provider: "mock"` — jujur &
  terdokumentasi di README (bukan mock-only; integrasi Gemini tetap asli).
- **Provider Gemini (`lib/ai/gemini.ts`):** `@google/genai@3.6.0` dengan `responseSchema`
  (OpenAPI subset, ditulis manual) + `responseMimeType: "application/json"`. Model
  **`gemini-3.5-flash-lite`** (cadangan `gemini-3.8-flash`; `gemini-2.5-flash` deprecated).
  Catatan runtime: `gemini-3.8-flash` sering 503 "high demand" di free key → default pakai
  `gemini-3.5-flash-lite` (lebih stabil). Terverifikasi live 2026-11-18.

## 8. Auth (single admin)

- **iron-session** (cookie signed+encrypted) + **bcryptjs** (hash di env).
- env: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (bcrypt cost 10–12), `SESSION_SECRET` (≥32 char).
- Login = Server Action (CSRF built-in). Cookie `httpOnly` + `secure`(prod) + `sameSite=lax` + ttl 7 hari.
- Guard dua lapis: `proxy.ts` (Next 16 — `middleware.ts` deprecated) matcher `'/dashboard/:path*'`
  dengan cek kasar `unsealData` + `requireAuth()` authoritative di layout dashboard **dan** di tiap Server Action.
- Bukan NextAuth/better-auth (asumsi user table; overkill untuk satu admin).

## 9. Async processing (bonus)

- `after()` dari `next/server` (stabil ≥ v15.1) di dalam `POST /api/briefs` dan di
  Server Action re-process: insert `PENDING` → return segera → LLM jalan post-response.
- `maxDuration = 60` di route (Hobby Fluid Compute max 300s; 60 cukup) → timeout SDK 30s < maxDuration → hang = `FAILED` bersih.
- Recovery row macet: `aiStatus` + tombol "Proses ulang" selalu tampil; `aiAttempts`/`updatedAt`
  untuk menandai baris `PROCESSING` yang stale.
- Polling dashboard/detail: SWR `refreshInterval: 2000` (atau `router.refresh()`).
- **Tidak** pakai QStash/Inngest (overkill untuk satu panggilan 3–15 detik).

## 10. Dashboard

- List: perusahaan, kategori, prioritas, status AI, tanggal masuk; **filter server-side**
  `?priority=&category=` (keduanya bisa dikombinasikan), urut `createdAt DESC`.
- Detail: data mentah form + hasil AI (summary/reason/missing_info) + tombol
  "Proses ulang AI" + select pipeline `New→Contacted→Proposal→Won/Lost` + "Draft email".
- UI: Tailwind + shadcn/ui Table sederhana + dua select filter (URL-synced). Tanpa
  TanStack Table kecuali butuh sorting/pagination polish.

## 11. Draft email (bonus)

- Server Action → LLM menulis draft balasan email klien (Bahasa Indonesia) dari summary
  + missing_info → tampil di detail + tombol copy. Provider sama (Gemini/mock).

## 12. Testing (bonus, minimal & terarah)

vitest, 3–5 test fokus (bukan coverage CRUD):
1. `aiResultSchema` menerima payload valid, menolak enum salah / field hilang.
2. `POST /api/briefs`: nama kosong, email invalid, tanggal masa lalu → 400 (server-side).
3. `processBrief`: LLM mock mengembalikan JSON invalid → `aiStatus=FAILED`; valid → `SUCCESS`.
4. Filter: `?priority=High&category=Website` kombinasi + masing-masing + kosong (assert SQL/query).

## 13. Versi terverifikasi (T0, 2026-11-18 — sumber primer)

Semua item riset dicek ulang (workflow 9 agent; detail + URL di `docs/research.md` §9). Pin:
`next@16.4.6` · `@google/genai@3.6.0` · model `gemini-3.5-flash-lite` (cadangan `gemini-3.8-flash`) ·
`prisma@7.10.1` · `iron-session@9.1.0` · `zod@4.6.7` · `vitest@5.1.1`. Node ≥22.13 (iron-session engines)
— lokal v24.12.0 aman; pin untuk Docker/Vercel. Model default **`gemini-3.5-flash-lite`**
(3.8-flash sering 503 "high demand" — lihat research §9 + AI-log).

Catatan build:
- `middleware.ts` → `proxy.ts` (default Node runtime).
- Gemini `responseSchema` ditulis manual (OpenAPI subset, `format: 'enum'`), bukan `z.toJSONSchema`.
- Prisma 7: `prisma generate` wajib di build Vercel; adapter **Neon** untuk prod, adapter **pg** untuk
  Postgres Docker lokal (pilih di `lib/db.ts`).
- Scaffold `--no-cache-components` (dashboard auth-gated).

## 14. Deploy

1. Neon: project region **Singapore**; ambil `DATABASE_URL` (pooled) + `DATABASE_URL_DIRECT`.
2. Migrasi: `prisma migrate deploy` terhadap `DATABASE_URL_DIRECT` (idempoten — jalankan tiap deploy;
   bukan di build step; jangan `prisma db push` di prod).
3. Vercel: import repo `agaaaptr/briefflow`; env lengkap; region `sin1` (co-locate dgn DB).
4. Smoke test URL live: submit form → summary muncul → login admin → filter → re-process.
5. Cold start ~1–5s saat klik pertama (Vercel Hobby + Neon scale-to-zero) — normal, jangan panik.

env (`.env.example` — hanya placeholder, `.env` gitignored):
```
DATABASE_URL=            # pooled (app)
DATABASE_URL_DIRECT=     # direct (migrasi)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
AI_PROVIDER=gemini       # gemini | mock
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=     # bcrypt
SESSION_SECRET=          # >=32 char
```

## 15. Commit plan (incremental, tiap commit runnable)

```
1  chore: scaffold Next.js + Prisma + deps
2  chore: prisma schema + initial migration
3  feat: public form + POST /api/briefs (server validation)
4  feat: AI summary (gemini + mock fallback + zod validation + retry)
5  feat: async processing with after()
6  feat: auth (login + session + dashboard guard)
7  feat: dashboard list + filters
8  feat: detail page + re-process + pipeline status
9  feat: draft email
10 test: schema + endpoint + processBrief
11 chore: docker-compose + Dockerfile
12 chore: deploy config (vercel.json)
13 docs: README + AI usage log
```

## 16. Video walkthrough (≤5 menit, English)

- 0:00–0:30 intro (nama + masalah 1 kalimat)
- 0:30–2:00 happy path: submit form → PENDING → summary muncul → filter → buka detail
- 2:00–3:00 failure path: paksa failed → "Proses ulang" → sukses; ubah pipeline status
- 3:00–3:30 arsitektur (1 diagram: form → API → after() → Gemini → jsonb; auth cookie; Prisma/Neon)
- 3:30–4:30 **kode terpenting**: `lib/ai/` (schema validation + retry + mock fallback)
- 4:30–5:00 sebut 3 cuts + link repo/live.

## 17. README (English, wajib) — outline

Title + one-liner · tech stack · local run (Docker & manual) · env table · architecture
+ DB schema · API · AI integration + prompt + mock-fallback note · security · testing ·
deployment · decisions & trade-offs · known limitations · "with more time" · **AI usage log**
(diminta eksplisit) · time spent. Kredensial admin + URL live dikirim via email balasan,
**bukan** ditulis di repo.

## 18. Next session kickoff (urutan kerja)

1. `cd briefflow` → baca `docs/design.md` + `docs/research.md` (sudah di folder ini).
2. `create-next-app` (TS, App Router, Tailwind) → `npx prisma init` → schema §5.
3. Kerjakan commit 1→13 berurutan; **deploy skeleton secepatnya** (commit ~2) agar URL
   live ada sejak awal, lalu iterasi.
4. Sebelum push: fresh-clone test README, scan `git log --all` + nama file untuk secret,
   pastikan `.env` tidak ter-commit.
5. Buat repo `agaaaptr/briefflow` via `gh`, push `main`.
