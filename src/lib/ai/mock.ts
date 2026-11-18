import { BUDGET_LABELS, type AiResult } from "@/lib/schema";
import type { SummaryInput } from "./prompt";

// Mock deterministik (tanpa random): dipakai saat AI_PROVIDER=mock (dev/test)
// dan sebagai fallback saat kuota Gemini habis — selalu ditandai provider "mock".

const CATEGORY_RULES: [RegExp, AiResult["service_category"]][] = [
  [/\bapp\b|android|ios|mobile/i, "Mobile App"],
  [/otomatis|chatbot|agent|\bai\b/i, "AI Automation"],
  [/social|instagram|tiktok|konten/i, "Social Media"],
  [/web|situs|landing|company profile|e-?commerce/i, "Website"],
  [/brand|logo|identitas/i, "Branding"],
];

const BUDGET_ORDER = [
  "UNDER_10M",
  "M10_25M",
  "M25_50M",
  "M50_100M",
  "OVER_100M",
] as const;

export function mockSummary(input: SummaryInput): AiResult {
  const category =
    CATEGORY_RULES.find(([re]) => re.test(input.needs))?.[1] ?? "Lainnya";
  const budgetRank = BUDGET_ORDER.indexOf(input.budget);
  const daysLeft = Math.ceil(
    (new Date(`${input.targetTimeline}T00:00:00Z`).getTime() - Date.now()) /
      86_400_000,
  );
  const priority: AiResult["priority"] =
    budgetRank >= 3 || daysLeft <= 14
      ? "High"
      : budgetRank <= 1 && daysLeft > 60
        ? "Low"
        : "Medium";
  const needsShort =
    input.needs.length > 120
      ? `${input.needs.slice(0, 117)}...`
      : input.needs;
  return {
    summary: `Klien mencari layanan ${category} dengan budget ${BUDGET_LABELS[input.budget]} dan target ${input.targetTimeline}. Kebutuhan: ${needsShort}`,
    service_category: category,
    priority,
    priority_reason:
      budgetRank >= 3
        ? "Budget bernilai besar sehingga diprioritaskan."
        : daysLeft <= 14
          ? "Timeline dekat sehingga urgent."
          : "Budget dan timeline moderat.",
    missing_info:
      input.needs.length < 60 ? ["detail ruang lingkup pekerjaan"] : [],
  };
}

// Draft balasan deterministik (mock path untuk fitur bonus draft email).
export function mockReplyDraft(input: {
  name: string;
  company: string;
  summary: string;
  missingInfo: string[];
}): string {
  const questions = input.missingInfo.length
    ? input.missingInfo.map((m) => `- ${m}`).join("\n")
    : "";
  return `Subjek: Tindak lanjut brief proyek ${input.company}

Halo ${input.name},

Terima kasih sudah mengirim brief melalui Briefflow. Kami sudah meninjau kebutuhan ${input.company} dan menangkapnya sebagai berikut: ${input.summary}

${
  questions
    ? `Agar proposal kami tepat sasaran, mohon bantuan untuk beberapa detail:\n${questions}\n`
    : ""
}
Setelah itu kami siap mengirim proposal berikut estimasi timeline. Apakah minggu ini ada waktu untuk diskusi singkat?

Salam,
Tim Sales`;
}
