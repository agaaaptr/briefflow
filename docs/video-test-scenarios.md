# Skenario Test Rekaman Video — Briefflow

> Pendamping `docs/video-script.md`. Ikuti langkah demi langkah; kolom **Cek** adalah apa
> yang harus terlihat di layar agar segmen itu benar. Narasi dalam Bahasa Inggris
> (video-nya Bahasa Inggris), ditulis di bawah tiap segmen.

## Persiapan (sebelum rekam)

1. **Live:** `https://briefflow-one.vercel.app` (kredensial dari email).
   **Lokal:** `http://localhost:3000`, login sesuai `ADMIN_EMAIL` + password yang kamu set di `.env`.
2. Untuk hasil **deterministik tanpa risiko kuota**, pakai `AI_PROVIDER=mock`
   (lokal: edit `.env` lalu `docker compose up -d app`; live: env Vercel). Mock = kategori
   & prioritas langsung terhitung dari kata kunci/budget/timeline, tanpa panggilan API.
3. Layar 1440p, browser zoom ~125%, font terminal besar (tips dari video-script).

---

## Skenario 1 — Happy path (0:30–2:00)

**Tujuan:** brief masuk → sukses seketika → AI isi summary/kategori/prioritas → filter → detail.

**Data brief (ketik persis):**

| Field | Isi |
| --- | --- |
| Nama | Rizky Pratama |
| Email | rizky@karsa.co.id |
| Nama perusahaan | Karsa Studio |
| Jenis kebutuhan | Rebranding logo dan pembuatan website company profile untuk peluncuran produk baru |
| Budget | Rp25–50 juta |
| Target timeline | 15 Desember 2026 (pilih di kalender) |

**Langkah:**

1. Buka `/` (form publik). Sebutkan 6 field.
2. Isi data di atas, klik **Kirim Brief**.
   - **Cek:** kartu sukses "Brief Anda sudah kami terima" muncul **segera** (AI jalan di background).
3. Buka `/dashboard`, login.
   - **Cek:** baris "Karsa Studio" tampil, terurut terbaru, badge kategori **Website**, prioritas **Medium**, status AI **Success**.
4. Demo filter: dropdown Prioritas = **High** → **Terapkan**.
   - **Cek:** daftar menyaring; URL berubah `?priority=HIGH` (bukti filter server-side).
5. Klik **Reset**, buka detail "Karsa Studio".
   - **Cek:** kiri data form asli, kanan hasil AI (summary, kategori, prioritas + alasan, daftar missing info).

**Narasi (contoh):** "Six fields: name, email, company, needs as free text, budget as IDR
ranges, and a target date that can't be in the past. The response comes back immediately —
the AI runs in the background. The brief already has a summary, a category, and a priority.
These two dropdowns are server-side filters — priority and category, combinable. Original
form data on the left; AI result on the right."

---

## Skenario 2 — Failure path + pipeline + draft email (2:00–3:30)

**Tujuan:** tunjukkan brief gagal → proses ulang → sukses → ubah pipeline → draft email.

**Cara membuat satu brief FAILED (sekali, sebelum rekam):**

1. Set `AI_PROVIDER=gemini` dan kosongkan `GEMINI_API_KEY`.
   (Kode melempar "GEMINI_API_KEY tidak diset" → bukan 429 → brief jadi **FAILED**, tanpa fallback mock.)
2. Submit satu brief:
   - Nama: **Budi Santoso** · Email: **budi@nusakopi.id** · Perusahaan: **Nusa Kopi**
   - Kebutuhan: **pembuatan aplikasi mobile untuk order kopi**
   - Budget: **Rp10–25 juta** · Timeline: **20 Desember 2026**
3. Tunggu beberapa detik, buka `/dashboard` → baris "Nusa Kopi" berstatus AI **Failed**.
4. Kembalikan `AI_PROVIDER=mock` lalu `docker compose up -d app` (lokal) agar tombol
   **Proses ulang AI** sukses saat direkam.

**Langkah rekam:**

1. Buka detail brief "Nusa Kopi" yang berstatus **Failed**.
   - **Cek:** kotak merah "Proses AI gagal:" + pesan error tampil; tombol **Proses ulang AI** ada.
2. Klik **Proses ulang AI**.
   - **Cek:** badge berubah **Processing** (berdenyut) → **Success**; hasil AI muncul
     (mock: kategori **Mobile App**, prioritas **Medium**).
3. Pipeline: dropdown status **New → Contacted → Simpan**; ulangi ke **Proposal**.
   - **Cek:** badge pipeline berubah dan **persist** (refresh tetap Proposal).
4. Klik **Buat draft email**.
   - **Cek:** textarea terisi draft Bahasa Indonesia yang menanyakan informasi yang kurang;
     klik **Copy** → label "Tersalin ✓".

**Narasi (contoh):** "What happens when the LLM fails? The brief is still saved, the error is
stored, and this button re-processes it. Status flips to Processing, then Success. The pipeline
status is persisted per brief. And the model drafts an Indonesian reply that asks for exactly
the missing information it identified — copy to clipboard."

---

## Catatan: hasil mock (deterministik) vs Gemini

- **Mock** memetakan kata kunci → kategori (mis. "website/company profile" → Website;
  "mobile/app" → Mobile App) dan budget/timeline → prioritas. Hasil selalu bisa diprediksi —
  ideal untuk rekaman tanpa kejutan.
- **Gemini (live)** hasilnya lebih "nyata" tapi bervariasi; ada risiko kuota 429 → otomatis
  fallback mock, dan hasilnya ditandai `provider: mock` di detail. Pakai Gemini bila ingin
  menunjukkan integrasi asli.
