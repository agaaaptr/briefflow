import { GoogleGenAI, Type } from "@google/genai";
import {
  PRIORITIES,
  SERVICE_CATEGORIES,
  aiResultSchema,
  type AiResult,
} from "@/lib/schema";
import {
  DRAFT_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  buildDraftPrompt,
  buildUserPrompt,
  type ReplyInput,
  type SummaryInput,
} from "./prompt";

// responseSchema ditulis manual sebagai OpenAPI subset (@google/genai) dan
// nilai enum-nya diambil dari konstanta yang sama dengan aiResultSchema —
// bukan z.toJSONSchema (bridge itu tidak terverifikasi; enum adalah bagian yang dinilai).

export class InvalidAiOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAiOutputError";
  }
}

export async function summarizeWithGemini(
  input: SummaryInput,
  repairFeedback?: string,
): Promise<AiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak diset walau AI_PROVIDER=gemini");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

  const prompt =
    `${SYSTEM_PROMPT}\n\n${buildUserPrompt(input)}` +
    (repairFeedback
      ? `\n\nPercobaan sebelumnya DITOLAK validator dengan alasan: ${repairFeedback}. Perbaiki dan kembalikan HANYA JSON yang valid sesuai schema.`
      : "");

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          service_category: {
            type: Type.STRING,
            format: "enum",
            enum: [...SERVICE_CATEGORIES],
          },
          priority: { type: Type.STRING, format: "enum", enum: [...PRIORITIES] },
          priority_reason: { type: Type.STRING },
          missing_info: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          "summary",
          "service_category",
          "priority",
          "priority_reason",
          "missing_info",
        ],
      },
      abortSignal: AbortSignal.timeout(30_000),
    },
  });

  const text = response.text ?? "";
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new InvalidAiOutputError(
      `Output bukan JSON yang bisa diparse: ${text.slice(0, 200)}`,
    );
  }
  const parsed = aiResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidAiOutputError(
      `Output tidak lolos schema: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

/** Draft email balasan — teks bebas (tanpa schema), tetap dengan timeout 30s. */
export async function draftReplyWithGemini(input: ReplyInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak diset walau AI_PROVIDER=gemini");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
  const response = await ai.models.generateContent({
    model,
    contents: `${DRAFT_SYSTEM_PROMPT}\n\n${buildDraftPrompt(input)}`,
    config: {
      abortSignal: AbortSignal.timeout(30_000),
    },
  });
  const text = response.text ?? "";
  if (!text.trim()) throw new InvalidAiOutputError("Draft kosong dari model");
  return text.trim();
}
