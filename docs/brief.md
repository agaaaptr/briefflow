# **Technical Test – Fullstack Developer (AI-Augmented)**

**Fugo Creative** · Deadline: **Kamis, 19 November 2026 pukul 09.00 WIB**

## **Konteks**

Fugo Creative menerima banyak brief proyek dari calon klien lewat email dan WhatsApp. Tim sales butuh satu tempat untuk mengumpulkan brief, lalu langsung melihat ringkasan dan prioritasnya tanpa membaca satu per satu. Tugasmu adalah membangun MVP dari tool internal ini.

## **Batasan**

> * **Waktu:** deadline Kamis, 19 November 2026 pukul 09.00 WIB. Estimasi pengerjaan 4–6 jam dengan bantuan AI tools, jadi tidak perlu sempurna; prioritaskan fitur wajib.  
> * **Stack:** bebas. Jika ragu, kami menyarankan Next.js/React \+ Node/Go/Laravel \+ PostgreSQL.  
> * Pekerjaan harus milikmu sendiri. Library, boilerplate, dan AI tools boleh, tapi sebutkan di README.

## **AI tools & LLM**

> * Untuk membantu coding, kamu boleh memakai AI tool apa pun (Claude Code, Cursor, Copilot, ChatGPT, dll.). Catat pemakaiannya di AI usage log.  
> * Untuk fitur AI processing di aplikasi, provider dan model bebas, misalnya OpenAI, Anthropic (Claude), Google Gemini, Groq, atau OpenRouter. Beberapa di antaranya punya free tier yang cukup untuk test ini. Model lokal (misalnya via Ollama) juga boleh, asalkan versi live tetap berfungsi.  
> * Apa pun provider-nya: output wajib berupa JSON sesuai schema dan divalidasi di kode, API key disimpan di env (tidak di-commit), dan nama provider/model ditulis di README.  
> * Jika kamu tidak punya akses ke API LLM sama sekali, boleh memakai mock dengan menjelaskannya di README. Bagian integrasi AI akan dinilai lebih rendah.

## **Fitur wajib**

> 1. **Public form: kirim brief**  
   * Field: nama, email, nama perusahaan, jenis kebutuhan (teks bebas), budget (pilihan rentang), target timeline (tanggal).  
   * Validasi: field wajib, format email, tanggal tidak boleh di masa lalu.  
   * Setelah submit, user melihat pesan sukses dan data tersimpan di database.

> 2. **AI processing**  
   * Setiap brief baru diproses LLM dan hasilnya disimpan sebagai JSON terstruktur (schema di bawah).  
   * Output divalidasi terhadap schema. Jika LLM gagal, timeout, atau output tidak valid, brief tetap tersimpan dengan status *failed* dan bisa diproses ulang dari dashboard.  
> 3. **Internal dashboard (wajib login)**  
   * Login dengan satu akun admin (seed atau env); halaman dashboard tidak bisa diakses tanpa login.  
   * List brief: nama perusahaan, kategori, prioritas, status AI, tanggal masuk; bisa di-filter per prioritas dan kategori, terurut dari yang terbaru.  
   * Detail brief: data asli dari form, hasil AI, dan tombol "Proses ulang AI".  
   * Status pipeline bisa diubah manual: New → Contacted → Proposal → Won / Lost.  
> 4. **Deploy**  
   * Aplikasi bisa diakses lewat URL publik (Vercel, Railway, Render, VPS, dll.) dengan kredensial admin untuk reviewer.

**Schema minimal hasil AI:**  
{  
  "summary": "ringkasan 1–2 kalimat",  
  "service\_category": "Branding \| Website \| Mobile App \| AI Automation \| Social Media \| Lainnya",  
  "priority": "High \| Medium \| Low",  
  "priority\_reason": "alasan singkat",  
  "missing\_info": \["informasi yang masih kurang dari brief"\]  
}

## **Nilai tambah (opsional, setelah fitur wajib selesai)**

> * Docker / docker-compose untuk menjalankan aplikasi secara lokal.  
> * Automated test, minimal untuk validasi output AI dan endpoint utama.  
> * Proses AI berjalan async (queue/background job), sehingga form tidak menunggu LLM.  
> * Fitur "draft email balasan ke klien" yang dibuat oleh AI.

## **Yang dikumpulkan**

> 1. Link repo GitHub publik, dengan commit history yang wajar (bukan satu commit besar di akhir).  
> 2. URL live \+ kredensial admin.  
> 3. README berisi: cara menjalankan secara lokal dan daftar env; penjelasan singkat arsitektur dan skema database; keputusan teknis dan trade-off; AI usage log (tools yang dipakai, untuk bagian apa, dan minimal 2 contoh saat kamu mengoreksi atau menolak output AI).  
> 4. Video walkthrough maksimal 5 menit: demo fitur dan penjelasan satu bagian kode yang menurutmu paling penting.

Kirim semuanya dengan membalas email undangan test paling lambat **Kamis, 19 November 2026 pukul 09.00 WIB**.

## **Cara kami menilai (100 poin)**

| Aspek | Bobot | Yang dilihat |
| :---- | :---- | :---- |
| Fitur wajib berjalan | 25 | Semua kriteria fitur wajib terpenuhi di URL live |
| Kualitas kode | 20 | Struktur folder, penamaan, duplikasi minim, error handling |
| Data model & API | 15 | Skema database masuk akal, validasi di sisi server, API rapi |
| Integrasi AI | 15 | Output terstruktur, validasi schema, handling gagal/retry, prompt jelas |
| Deploy & keamanan dasar | 10 | Live, route admin terlindungi, tidak ada secret di repo |
| README, AI log & komunikasi | 15 | Keputusan dijelaskan dengan jujur, video jelas |

##  

## **Tahap berikutnya**

Kandidat yang lolos diundang interview 60 menit, termasuk live code review atas repo mereka sendiri dan satu perubahan kecil yang dikerjakan langsung (sekitar 20 menit).