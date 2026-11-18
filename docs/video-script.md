# Video walkthrough script (≤ 5 minutes, English)

Recording tips: screen 1440p, browser zoom ~125%, terminal font large. Show, don't read.

## 0:00–0:30 — Intro

> "Hi, I'm Aga. This is Briefflow, an internal tool for a sales team: clients submit a
> project brief on a public form, an LLM summarizes and prioritizes it, and the team
> manages everything from a login-protected dashboard."

## 0:30–2:00 — Happy path (live URL)

1. Open the public form. "Six fields: name, email, company, needs as free text,
   budget as IDR ranges, and a target date that can't be in the past."
2. Submit a realistic brief (e.g. "rebranding + website company profile, Rp25–50 juta,
   mid-December"). "Success comes back immediately — the AI runs in the background."
3. Log in to `/dashboard` (admin credentials). "The brief already has a summary,
> a category, and a priority. The list sorts newest-first and these two dropdowns are
> server-side filters — priority and category, combinable." Demo one filter.
4. Open the detail: "Original form data on the left; AI result on the right — summary,
   category, priority with its reason, and missing information as a list."

## 2:00–3:00 — Failure path + pipeline

1. "What happens when the LLM fails?" Show a FAILED brief (or re-run with the key off):
   "The brief is still saved, the error is stored, and this button re-processes it."
   Click Proses ulang AI → status flips to Processing → Success.
2. Pipeline: change status New → Contacted → Proposal. "Persisted per brief — this is
   the sales pipeline the team actually uses."
3. Draft email: click "Buat draft email". "The model drafts an Indonesian reply that
   asks for exactly the missing information it identified. Copy to clipboard."

## 3:00–3:30 — Architecture (one diagram)

Show the ASCII diagram from the README:
"Public form POSTs to a route handler — Zod validation and a rate limit before anything
touches the database. The row is saved with status PENDING and `after()` runs the LLM
after the response. Gemini returns structured JSON validated against a Zod schema — one
repair retry, then the brief is marked FAILED and re-processable. Results are stored as
JSON plus two promoted columns for filtering. One Postgres table, Prisma on Neon,
single admin from env, session cookie."

## 3:30–4:30 — The code I care about (`src/lib/ai/`)

Open `src/lib/ai/index.ts` + `gemini.ts`:
"This is the part I'd defend in review. The provider is configurable — Gemini or a
deterministic mock. Every response goes through `safeParse`; a failure triggers one
repair retry that feeds the validator error back to the model. A 429 falls back to the
mock — but look: the stored result says `provider: mock`. The data never lies about
where it came from. There's also a test asserting the Gemini response schema enums and
the Zod enums are built from the same constants."

## 4:30–5:00 — Honest cuts + close

> "Three deliberate cuts, documented in the README: the rate limit is per-instance, not
> global; no pagination yet; and draft emails aren't persisted. Repo and live URL are in
> the submission email. Thanks for watching."
