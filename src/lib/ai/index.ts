import type { AiResult } from "@/lib/schema";
import { summarizeWithGemini } from "./gemini";
import { mockSummary } from "./mock";
import type { SummaryInput } from "./prompt";

export type { AiResult, SummaryInput };

export type SummaryOutcome = {
  data: AiResult;
  provider: "gemini" | "mock";
  model: string;
  /** Terisi saat fallback mock karena kuota Gemini habis — disimpan jujur di aiResult. */
  note?: string;
};

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
}

/**
 * Orkestrator: AI_PROVIDER=mock → mock langsung. AI_PROVIDER=gemini →
 * max 2 attempt (initial + 1 repair dengan feedback error validator).
 * Kuota habis (429) → fallback mock dengan catatan. Error lain → throw
 * (brief ditandai FAILED oleh processBrief, bisa diproses ulang).
 */
export async function generateBriefSummary(
  input: SummaryInput,
): Promise<SummaryOutcome> {
  if (process.env.AI_PROVIDER === "mock") {
    return { data: mockSummary(input), provider: "mock", model: "mock" };
  }
  const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await summarizeWithGemini(
        input,
        attempt === 1 && lastError instanceof Error
          ? lastError.message
          : undefined,
      );
      return { data, provider: "gemini", model };
    } catch (err) {
      lastError = err;
      if (isQuotaError(err)) {
        return {
          data: mockSummary(input),
          provider: "mock",
          model: "mock",
          note: `Fallback mock — kuota Gemini habis: ${
            err instanceof Error ? err.message : err
          }`,
        };
      }
    }
  }
  throw lastError;
}
