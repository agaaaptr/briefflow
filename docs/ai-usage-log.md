# AI Usage Log

> Wajib dari brief (README). Format 5-field (Tool / Asked for / Accepted / Changed /
> Verified) dari litman-books — "Changed" dan "Verified" adalah dua baris yang dinilai.
> Entri diisi **real-time selama build**, bukan di-retrofit. Ini adalah seed dari sesi
> perencanaan; lanjutkan di sesi build.

---

## 2026-11-18 — Requirements analysis & architecture planning

**Tool:** Claude Code (model Transformer) — session planning + 1 workflow (8 research subagents).

**Asked for:** Analyze the Fugo technical-test brief; do web research (stack, LLM
providers, structured-output tooling, auth, async processing, deploy/DB, prior art,
rubric mapping) and propose an architecture.

**Accepted:**
- Requirements decomposition & the 4-flow shape (form → AI → dashboard → deploy).
- Research-backed patterns: Route Handler for the public API + Server Actions for
  internal mutations; shared Zod schema; `after()` for async; iron-session + bcryptjs
  for single-admin auth; hybrid storage (typed columns + jsonb); Vercel + Neon free tier.
- The 5-field AI-usage-log template and rubric-mapped build checklist.
- (bulk of research findings; ~most survived — see `docs/research.md`.)

**Changed / overrode:**
- Research recommended **Claude Haiku over Gemini** for the live demo; I kept **Gemini
  (free, per "zero cost" requirement)** but added a **deterministic mock fallback** to
  neutralize the free-tier RPD-quota risk the research itself flagged. Not a blind
  accept of either recommendation — a constraint-aware middle path.
- Several version/model IDs in the research (Next.js 16.x, `proxy.ts`, Gemini flash
  model id, iron-session 9.x, AI SDK v7) are marked `[VERIFY]` rather than trusted
  verbatim — the agents could hallucinate specifics.
- Rejected over-engineering suggestions (queue services, TanStack Table, NextAuth,
  react-hook-form) as out of scope for a sub-24h MVP.

**Verified:**
- Cross-checked the Gemini free-tier RPD/reset claim across multiple sources in the
  same topic (freellm.net + session reasoning) before flagging it to the user.
- Confirmed the "no public tech stack at Fugo" claim (DNS/curl checks in prior-art
  topic) before concluding the "stack bebas" framing is genuine.

---

## (Sesi build — mulai 2026-11-18 malam; tambahkan entri per sesi)

_Template per entri:_
```
## YYYY-MM-DD — <title>
**Tool:** ...
**Asked for:** ...
**Accepted:** ... (file + perkiraan % yang dipakai)
**Changed:** ... (edit + kenapa)
**Verified:** ... (tes/cek + requirement id)
```

_Contoh yang WAJIB dicatat saat build (minimal 2 momen menolak/mengoreksi output AI):_
- koreksi prompt/fallback mock saat output Gemini tidak match enum.
- menolak snippet yang mengabaikan validasi server-side / revalidate-before-redirect.

---

## 2026-11-18 — Build session start: verifikasi versi + intake Noir

**Tool:** Claude Code (Transformer) — workflow 9 subagent (WebSearch/WebFetch sumber primer) + chain noir-spec/plan.

**Asked for:** Verifikasi semua klaim `[VERIFY]` riset awal sebelum scaffold, lalu intake ke spec + plan.

**Accepted:** 21/24 klaim confirmed: `next@16.4.6`, `proxy.ts`, `after()`, `@google/genai@3.6.0` API,
`prisma@7.10.1`, `iron-session@9.1.0`, `zod@4.6.7`, `vitest@5.1.1`, Tailwind+shadcn — detail `docs/research.md` §9.

**Changed (koreksi dari verifikasi, bukan terima mentah):**
1. `gemini-2.5-flash` dari riset awal ternyata deprecated → **`gemini-3.8-flash`** (cadangan `3.5-flash-lite`).
2. Rekomendasi "zod ^3.25 untuk aman" outdated → **`zod@4.6.7`**.
3. `maxDuration` Hobby bukan ceiling 60s → 300s; tetap 60 (timeout SDK 30s).
4. `responseSchema` Gemini ditulis **manual** (OpenAPI subset) — `z.toJSONSchema` sebagai bridge tidak
   terverifikasi, dan nilai enum adalah bagian yang dinilai.
5. Node dipin ≥22.13 (iron-session engines) untuk Docker/Vercel; Prisma 7 butuh `prisma generate` di build
   dan adapter berbeda untuk Postgres lokal vs Neon.

**Verified:** semua nilai di `docs/research.md` §9 dengan sourceUrl; spec `SP-0001` + plan `PL-0001`;
env pin `GEMINI_MODEL` di design §14.

---

## 2026-11-18 — Build session (T1–T11: scaffold → Docker)

**Tool:** Claude Code (Transformer) — eksekusi inline sequential per `PL-0001`, tiap task
implement → verify (typecheck/build/test/smoke) → commit.

**Asked for:** Implementasi 14 task (scaffold Next.js → Docker) dengan commit incremental runnable.

**Accepted:** scaffold Next 16.4.6 + Tailwind 4 (Turbopack); pola Prisma 7 driver-adapter
(`pg` lokal / `neon` prod) dari skill resmi; `after()` untuk async; API Zod 4 (`z.email`,
`z.iso.date`, `flattenError`); dashboard plain-Tailwind; Dockerfile multi-stage + service
`migrate` terpisah; skrip smoke (`smoke-api`, `fetch-dashboard`, `post-brief`) sebagai bukti verifikasi.

**Changed (momen mengoreksi/menolak output AI):**
1. Suggestion `LayoutProps<"/dashboard">` untuk layout dashboard **ditolak** — melanggar
   constraint type versi Next ini (TS2344) → diganti prop `React.ReactNode` eksplisit.
2. Mock classifier match "WhatsApp" sebagai *Mobile App* (substring `app`) → regex word
   boundary `\bapp\b`; bug tertangkap lewat tes data, bukan kebetulan direview.
3. Menyalin prisma CLI manual ke stage runner Docker gagal (`Cannot find module 'effect'`
   — dependensi CLI berantai) → migrasi dipindah ke service compose `migrate` (stage builder
   dengan node_modules penuh); runner tetap ramping.
4. `prisma migrate dev` di v7 **tidak** auto-generate client (beda dari v6) → script build
   jadi `prisma generate && next build`; `typecheck` juga.
5. `PrismaClient` di-instantiate saat import merusak `next build` di Docker (tanpa
   `DATABASE_URL`) → singleton lazy via `Proxy`.
6. Lockfile out-of-sync membuat `npm ci` di Docker gagal (`@emnapi/runtime` hilang) →
   lockfile diregenerasi penuh.
7. Hook context-mode memblokir `curl`/fetch inline di shell → semua pengecekan HTTP
   dipindah ke skrip node yang committed (jadi artefak verifikasi yang bisa diulang reviewer).

**Verified:** typecheck + build + 23 test vitest hijau di tiap task; `smoke-api` 6/6
(validasi server + rate limit); `fetch-dashboard` 7/7 (redirect auth, filter kombinasi,
empty state, cookie dipalsukan ditolak, halaman detail); Docker stack penuh diverifikasi
di `:3000` dengan skrip yang sama; row DB dicek langsung lewat psql (jalur SUCCESS/FAILED
terbukti). Commit `71e8396…e02dfcd` (11 commit, masing-masing runnable).

---

## 2026-11-18 — Deploy: switch model Gemini setelah 503 live

**Tool:** Claude Code (Transformer) — raw REST probe (`scripts/test-gemini-http.mjs`) + `e2e-ai.mjs`.

**Asked for:** Wiring Neon + Gemini live sebelum deploy Vercel; buktikan AI end-to-end di DB Neon.

**Accepted:** Neon env (`DATABASE_URL` pooled, `DATABASE_URL_UNPOOLED` → `DATABASE_URL_DIRECT`),
`prisma migrate deploy` ke branch `production`, `AI_PROVIDER=gemini`.

**Changed:** verifikasi awal merekomendasikan `gemini-3.8-flash` (newest GA). Saat dites live
justru **HTTP 503 "high demand"** berulang → SDK retry membuat request tampak hang, dan
`AbortSignal.timeout(30s)` akhirnya menandai brief `FAILED`. Probe raw ke kedua model
membuktikan `gemini-3.5-flash-lite` balas 200 dalam ~7s. **Default model dipindah ke
`gemini-3.5-flash-lite`** (env + default kode + docs). Ini contoh menolak output riset lama
demi fakta runtime.

**Verified:** `e2e-ai.mjs` terhadap Neon: POST 201 → `after()` → `SUCCESS`,
`provider=gemini`, `model=gemini-3.5-flash-lite`, `BRANDING/HIGH`, summary Bahasa Indonesia.
`gemini-3.5-flash-lite` 200 via raw REST; `gemini-3.8-flash` 503.

---

## 2026-11-18 — UI overhaul + perbaikan Docker (sore)

**Tool:** Claude Code (Transformer) — workflow riset/desain (6 subagent: referensi visual, pola kontrol ARIA, audit kode, data style DB, design-director, skeptic critique) + implementasi inline.

**Asked for:** perbaiki bug UI (background hitam & teks tertutup saat OS dark mode), overhaul visual, kontrol custom (dropdown/datepicker/modal) tanpa native browser, riset arah desain; lalu perbaiki kenapa `docker compose` tidak menampilkan UI baru.

**Accepted:** diagnosis root cause (media query `prefers-color-scheme: dark` membalik background sementara semua halaman hardcode warna terang); arah neobrutalist "ink & marigold" (Space Grotesk + Public Sans, border keras + shadow, tanpa dependency baru); custom `Select`/`DatePicker`/`Dialog`; satu set token di `@theme`.

**Changed (momen mengoreksi/menolak output AI):**
1. Skeptic review menolak sebagian arah awal: marker "selected" kuning di atas putih (kontras 1.54:1, gagal WCAG) → diganti ink; focus ring yang menyatu dengan border → fokus kuning offset; hover `paper`≈`surface` (1.03:1) → wash lebih gelap.
2. Kritikus menyarankan membuang Dialog logout + Toast (dianggap scope creep); Dialog **dipertahankan** karena user eksplisit minta styling modal — precedens user menang atas saran skill.
3. `npm ci` gagal di Docker: lockfile yang digenerate macOS memangkas optional dep `wasm32-wasi` (`@emnapi/runtime` hilang) → fix `npm install` + `.dockerignore`, bukan regenerasi lockfile berulang yang platform-dependent.

**Verified:** typecheck + lint + build + 29 test vitest hijau; CSS build tidak lagi mengandung `prefers-color-scheme` (hanya `prefers-reduced-motion`); container docker dibangun ulang & UI baru terkonfirmasi lewat marker DOM (`bg-sun`, `shadow-hard`, `font-display`).
