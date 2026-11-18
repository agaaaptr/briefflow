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
