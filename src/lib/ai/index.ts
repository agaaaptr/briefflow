import type { AiResult } from "@/lib/schema";
import { draftReplyWithGemini, summarizeWithGemini } from "./gemini";
import { mockReplyDraft, mockSummary } from "./mock";
import type { ReplyInput, SummaryInput } from "./prompt";

export type { AiResult, SummaryInput, ReplyInput };

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
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
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

/**
 * Draft email balasan (bonus). Provider sama dengan ringkasan;
 * kuota habis → fallback mock, error lain → throw.
 */
export async function generateReplyDraft(
  input: ReplyInput,
): Promise<{ draft: string; provider: "gemini" | "mock" }> {
  if (process.env.AI_PROVIDER === "mock") {
    return { draft: mockReplyDraft(input), provider: "mock" };
  }
  try {
    return { draft: await draftReplyWithGemini(input), provider: "gemini" };
  } catch (err) {
    if (isQuotaError(err)) {
      return { draft: mockReplyDraft(input), provider: "mock" };
    }
    throw err;
  }
}
