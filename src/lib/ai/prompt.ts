import { BUDGET_LABELS } from "@/lib/schema";

// Prompt ditampilkan utuh di README (rubrik menilai kejelasan prompt).
export const SYSTEM_PROMPT = `Anda adalah asisten triase brief untuk agensi kreatif. Tugas Anda membaca brief calon klien lalu menghasilkan ringkasan, kategori layanan, prioritas, alasan prioritas, dan daftar informasi yang masih kurang.

Aturan output:
- Output HANYA JSON valid sesuai schema — tanpa teks lain, tanpa markdown fence.
- "service_category" wajib salah satu dari: "Branding", "Website", "Mobile App", "AI Automation", "Social Media", "Lainnya".
- "priority" wajib salah satu dari: "High", "Medium", "Low".
- Semua teks ditulis dalam Bahasa Indonesia.
- "summary": ringkasan 1-2 kalimat.
- "priority_reason": alasan singkat 1 kalimat (pertimbangkan nilai budget, urgensi timeline, dan kejelasan kebutuhan).
- "missing_info": array of string — informasi penting yang belum disebut brief; kosongkan [] jika sudah lengkap.

Contoh output:
{"summary":"Klien membutuhkan rebranding menyeluruh dan pembuatan website company profile dengan target dua bulan.","service_category":"Branding","priority":"High","priority_reason":"Budget besar dan timeline yang urgent.","missing_info":["jumlah halaman website","referensi brand yang disukai"]}`;

export type SummaryInput = {
  needs: string;
  budget: keyof typeof BUDGET_LABELS;
  targetTimeline: string; // YYYY-MM-DD
};

export function buildUserPrompt(input: SummaryInput): string {
  return `Brief calon klien:
- Jenis kebutuhan: ${input.needs}
- Budget: ${BUDGET_LABELS[input.budget]}
- Target timeline: ${input.targetTimeline}

Proses brief ini dan kembalikan JSON sesuai aturan di atas.`;
}

// ---- Draft email balasan (bonus) ----

export const DRAFT_SYSTEM_PROMPT = `Anda adalah anggota tim sales sebuah agensi kreatif. Tulis draft email balasan ke calon klien berdasarkan ringkasan AI atas brief mereka.

Aturan:
- Bahasa Indonesia, nada profesional dan ramah.
- Format: baris "Subjek: ..." lalu blank line lalu isi email (sapaan, tanggapan singkat atas kebutuhan, pertanyaan untuk melengkapi informasi yang kurang, ajakan lanjut, tanda tangan "Tim Sales").
- Maksimal ~200 kata. Output HANYA teks email — tanpa penjelasan lain.`;

export type ReplyInput = {
  name: string;
  company: string;
  summary: string;
  missingInfo: string[];
};

export function buildDraftPrompt(input: ReplyInput): string {
  return `Data klien:
- Nama: ${input.name}
- Perusahaan: ${input.company}
- Ringkasan AI atas brief: ${input.summary}
- Informasi yang masih kurang: ${
    input.missingInfo.length ? input.missingInfo.join("; ") : "(sudah lengkap)"
  }

Tulis draft email balasannya.`;
}
