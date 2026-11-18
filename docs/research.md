# Research Findings (2026-11-18)

Hasil riset web (8 agent paralel, WebSearch + WebFetch). Ini referensi yang diadopsi ke
`docs/design.md`. Semua versi/ID model bertanda `[VERIFY]` harus dicek ulang saat build —
bisa berubah atau salah (riset AI bisa halusinasi).

## 1. Next.js patterns
- App Router satu-satunya arsitektur yang direkomendasikan; Pages Router legacy. `[VERIFY]` Next 16.x, Turbopack default, middleware→`proxy.ts`.
- `params`/`searchParams`/`cookies()`/`headers()` semuanya **async** di Next 15+ → `await` selalu (penyebab #1 build error saat scaffold cepat).
- Public form = **Route Handler** (`POST /api/briefs`); mutasi internal = **Server Action**. Keduanya share satu Zod schema + satu `lib/briefs` service.
- Form 6 field independen → native `<form>` + server-side `safeParse`, **skip react-hook-form** (setengah kode).
- `revalidatePath` sebelum `redirect()` (redirect melempar `NEXT_REDIRECT`).
- Struktur minim: `app/`, `lib/` (db, schema, ai, auth, briefs), `components/`, `actions/`.
- Zod 4 punya `z.flattenError`; `[VERIFY]` pakai zod ^3.25 untuk aman vs schema→JSON-Schema regression.
- Sumber: nextjs.org, dev.to (server-actions-vs-route-handlers, nextjs-structure-2026), zod.dev.

## 2. LLM providers (poin paling penting untuk demo)
- **Risiko Gemini free tier**: kuota harian (RPD) bisa ~20 request, reset jam ~15.00 WIB (Pacific) → kuota build malam ini masih terhitung saat reviewer buka 09.00 WIB besok. Free prompt bisa dipakai Google untuk product improvement.
- Claude Haiku (`[VERIFY]` claude-haiku-5-5) ~$0.0003/brief, Start tier 4k RPM → bebas 429, tapi butuh topup kecil (~$5 trial credit).
- OpenRouter free 50 RPD + router model acak → non-deterministik, unfit. Groq free 8k TPM. OpenAI `[VERIFY]` gpt-6-luna setara Haiku tapi tanpa free tier.
- **Keputusan:** Gemini free + mock fallback (memakai Gemini asli saat live, fallback mock saat 429). Integrasi tetap nyata, bukan mock-only.
- Sumber: platform.claude.com (structured outputs), freellm.net, klymentiev.com (groq/openrouter free tier).

## 3. Structured output tooling
- `[VERIFY]` Vercel AI SDK v7 menghapus `generateObject` → `generateText({ output: Output.object({schema}) })`. SDK **tidak** auto-repair schema violation; retry loop harus ditulis manual.
- Pattern repair loop: `NoObjectGeneratedError` → feed `error.text`/`cause` balik → retry → `FAILED`. ~92% sukses attempt 1, ~99.5% dalam 3.
- Timeout: `AbortSignal.timeout(ms)` (native), lewat `abortSignal`.
- Prompt stabil: role framing + enum value ditulis eksplisit + "output ONLY JSON" + `.describe()` per field + 1 contoh + instruksi bahasa.
- **Keputusan kita:** raw `@google/genai` + `aiResultSchema.safeParse()` sendiri (validasi di kode eksplisit, bukan tersembunyi di SDK), retry manual, timeout 30s. (Vercel AI SDK dicatat sebagai alternatif trade-off.)
- Storage hybrid: kolom typed untuk field yang difilter/sort + `jsonb` untuk payload AI penuh.
- Sumber: vercel/ai issues #11696 & #10240, n4n.ai, exobench.ai.

## 4. Auth single-admin
- **iron-session** (`[VERIFY]` v9.x, ESM) + **bcryptjs** (cost 10–12). Skip NextAuth/better-auth (asumsi user table, overkill untuk 1 admin env).
- Password hash di env (`ADMIN_PASSWORD_HASH`), jangan plaintext. Generate sekali: `node -e "require('bcryptjs').hash(...)"`.
- Guard 2 lapis: matcher `'/dashboard/:path*'` (cek kasar, Web-Crypto `unsealData` — node:crypto tidak ada di Edge) + `requireAuth()` authoritative di layout + tiap Server Action.
- Server Actions = CSRF built-in (Origin vs Host); Route Handler = tanpa CSRF bawaan.
- Cookie: `httpOnly` + `secure`(prod) + `sameSite=lax` + ttl 7 hari; `SESSION_SECRET` ≥32 char dari env.
- Sumber: registry npm iron-session, rubel.dev, safeguard.sh (CWE-784).

## 5. Async processing
- `after()` dari `next/server` (stabil ≥ v15.1): callback jalan setelah response; didukung di Server Action **dan** Route Handler; jalan bahkan saat `redirect()`/`notFound()`.
- `after()` **tidak** menambah runtime — share `maxDuration`; callback dibatalkan jika timeout. Jadi: SDK timeout < `maxDuration`.
- `[VERIFY]` Vercel Hobby: `maxDuration` 60s (Fluid Compute default 300s); `export const maxDuration = 60`.
- Recovery: `aiStatus` + tombol re-process selalu ada + `updatedAt` untuk deteksi stale.
- Polling: SWR `refreshInterval: 2000`. **Skip** QStash/Inngest/trigger.dev (overkill).
- Anti-pattern: fire-and-forget tanpa `after()` tidak durable.
- Sumber: nextjs.org (after, maxDuration), vercel.com/kb, adroit.io.

## 6. Deploy & DB
- **Vercel Hobby + Neon Free** satu-satunya kombo free-tier permanen (tanpa kartu, tanpa expiry, tanpa data wipe). Cold start sub-2s keduanya; klik pertama ~1–5s (normal).
- Railway: tidak ada free tier permanen (trial $5/30 hari). Render: spin-down 30–60s + Postgres expire 30 hari → disqualify.
- Neon: scale-to-zero 5 menit idle, **tidak** pause project (beda dari Supabase 7 hari). 1 GB storage.
- Neon: pooled URL untuk runtime, direct URL untuk migrasi. `[VERIFY]` `@prisma/adapter-neon` (Prisma lebih berat ~1.5s cold start vs Drizzle, tapi keputusan stack = Prisma).
- Migrasi: `prisma migrate deploy` sekali lokal ke direct URL, **bukan** di build step; jangan `db push` di prod.
- Region: Vercel `sin1` + Neon Singapore (co-locate untuk reviewer Indonesia).
- Sumber: vercel.com/docs/plans/hobby, neon.com (free plan FAQ, connect), railway.com/pricing, render.com.

## 7. Prior art / referensi
- **Fugo Creative** = PT Fugo Creative Group, Bandung (2016, ~10–50 staff, CEO Sona Lesmana). Layanan: branding/logo, desain grafis, motion/video, social media, website/digital identity, event organizer. Positioning "mitra strategis membantu brand bertumbuh". Klien: Trick Burger, Green Slice. `fugocreative.co.id` tidak resolve; `fugocreative.com` = perusahaan India yang TIDAK terkait (jangan scrape). Tidak ada public tech stack → klaim "stack bebas" valid.
- **vercel-labs/lead-agent** = referensi arsitektur terdekat: Next.js + AI SDK `generateObject` atas Zod schema, form return sukses langsung, klasifikasi async. Adopsi pola "success now, classify async, mark failed".
- **technicallypete/outreacher** = pipeline status new→contacted→…→converted; mirror untuk enum pipeline.
- **openstatusHQ/data-table-filters** + shadcn/ui Table = pola filter faceted (URL-synced, `?priority=&category=`).
- **litman-books AI usage log** = template 5 field (Tool / Asked for / Accepted / Changed / Verified) — "Changed" & "Verified" yang dinilai. Dipakai untuk log AI di README.
- Sumber: signalhire, idntimes.com, github (vercel-labs/lead-agent, technicallypete/outreacher, openstatushq, litman-books), ui.shadcn.com.

## 8. Rubrik → checklist build
- **Red flag rejection cepat:** satu commit raksasa; README gagal fresh-clone; secret ter-commit (harus rotate, bukan cuma hapus file); dead code/debug print; over-engineering.
- **AI-augmented:** transparansi > deteksi — log apa yang ditanya/diterima/ditolak/diubah + waktu; jangan klaim "saya tulis semua".
- **Wajib (25):** validasi server-side semua field; LLM gagal → `failed` → re-process; filter prioritas+kategori server-side + test kombinasi; pipeline New→…→Won/Lost persist; urut terbaru (`ORDER BY createdAt DESC`).
- **Kode (20):** 0 debug print + lint/typecheck; SATU schema bersama (form + output LLM); tidak ada dep tak terpakai; naming jelas.
- **Data model & API (15):** satu tabel (parsed fields + `raw_ai_json` + `ai_status` + `pipeline_status` enum/CHECK); API return DTO saja; filter/sort di SQL bound params; category/priority constrained enum.
- **AI (15):** strict JSON + validasi schema di kode; timeout + try/catch → `failed`; re-process idempotent; **tampilkan prompt** di kode + README.
- **Deploy & security (10):** admin hash bcrypt dari env; cookie httpOnly + guard server-side semua route dashboard; public form = trust boundary (validasi + basic rate limit); verifikasi login admin di URL live.
- **README/AI-log/komunikasi (15):** run command tepat + versi runtime; env table; asumsi; trade-off; known limitations; "with more time"; time spent; AI log; reply email dengan repo+live+creds+video.
- **Video:** demo happy path dulu → 1 diagram arsitektur → sebut 3 cuts → tutup link. Tanpa baca slide, tanpa claim "saya buat semua", ≤5 menit.
- Sumber: offerpilotai.ink, sevydevy.com, easyenv.io, getintegritylens.com, stackoverflow (atomic commits).

## 9. Verifikasi ulang — workflow 9 agent (2026-11-18, sumber primer)

21/24 klaim confirmed. Tiga koreksi:

| Klaim awal | Status | Nilai benar |
| --- | --- | --- |
| Hobby `maxDuration` ceiling 60s | outdated | Fluid Compute: Hobby default & max **300s**; 60 tetap valid |
| Model free tier `gemini-2.5-flash` | outdated | **`gemini-3.8-flash`** (GA, free) / `gemini-3.5-flash-lite`; 2.5 deprecated & dialihkan 2026-12-01 |
| Zod `^3.25` untuk aman | outdated | **`zod@4.6.7`** stable current |
| Free-tier RPD/RPM Gemini | unclear | Tidak dipublikasi; baca console per-project AI Studio. RPD reset midnight Pacific |

Terkonfirmasi: `next@16.4.6` · `middleware.ts` → **`proxy.ts`** (default Node runtime) · Turbopack default
dev+build · `after()` stabil di Route Handler & Server Action · `@google/genai@3.6.0`
(`generateContent({model, contents, config:{responseMimeType, responseSchema}})`, `GOOGLE_API_KEY`
menang atas `GEMINI_API_KEY`) · responseSchema JSON mode jalan di free key · `prisma@7.10.1`
(adapter Neon prod, migrasi direct URL) · `iron-session@9.1.0` (Node ≥22.13) · `vitest@5.1.1` (Node ≥22.12)
· Tailwind + shadcn CLI current.

**Gap audit yang ditutup saat build:**
- **Gemini schema bridge:** tulis `responseSchema` manual sebagai OpenAPI subset (`Type.OBJECT` + `format:
  'enum'`), bukan `z.toJSONSchema()` (unverified); 1 test memastikan nilai enum cocok dengan `aiResultSchema`.
- **Node pin ≥22.13** (iron-session engines) untuk Docker image + Vercel; lokal v24.12.0 aman.
- **Prisma 7:** `prisma generate` wajib di build Vercel; lokasi client mengikuti CLI saat scaffold.
- **Docker lokal:** postgres container butuh adapter **pg**, bukan adapter Neon (Neon-only) — pilih adapter
  per environment di `lib/db.ts`.
- **Cache Components** default ON di create-next-app 16 → scaffold dengan `--no-cache-components`
  (dashboard auth-gated); kalau tetap ON, `cookies()` memaksa dynamic.
- **Demo quota:** mock fallback 429 dipertahankan; angka RPD aktual dibaca dari console, jangan diasumsikan.
