import { z } from "zod";

export const budgetSchema = z.enum(
  ["UNDER_10M", "M10_25M", "M25_50M", "M50_100M", "OVER_100M"],
  "Pilih rentang budget",
);

export const BUDGET_LABELS: Record<z.infer<typeof budgetSchema>, string> = {
  UNDER_10M: "< Rp10 juta",
  M10_25M: "Rp10–25 juta",
  M25_50M: "Rp25–50 juta",
  M50_100M: "Rp50–100 juta",
  OVER_100M: "> Rp100 juta",
};

function notPastDate(value: string) {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return value >= todayIso;
}

// Satu schema bersama: dipakai form publik, API route, dan (parsial) dashboard.
export const briefSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  email: z.email("Format email tidak valid"),
  company: z.string().trim().min(1, "Nama perusahaan wajib diisi"),
  needs: z.string().trim().min(1, "Jenis kebutuhan wajib diisi"),
  budget: budgetSchema,
  targetTimeline: z
    .iso.date("Tanggal timeline wajib diisi (YYYY-MM-DD)")
    .refine(notPastDate, "Tanggal tidak boleh di masa lalu"),
});

export type BriefInput = z.infer<typeof briefSchema>;
