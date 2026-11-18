import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    brief: {
      findUnique: vi.fn(),
      update: vi.fn(async () => ({})),
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { processBrief } from "@/lib/briefs";
import { prisma } from "@/lib/db";
import type { Brief } from "@/generated/prisma/client";

const fixture = {
  id: "b1",
  needs: "Pembuatan website company profile dan landing page",
  budget: "M25_50M" as const,
  targetTimeline: new Date("2099-06-01T00:00:00Z"),
} as unknown as Brief;

const originalProvider = process.env.AI_PROVIDER;

beforeEach(() => {
  vi.mocked(prisma.brief.findUnique).mockResolvedValue(fixture);
  vi.mocked(prisma.brief.update).mockClear();
});

afterEach(() => {
  if (originalProvider === undefined) delete process.env.AI_PROVIDER;
  else process.env.AI_PROVIDER = originalProvider;
  vi.restoreAllMocks();
});

describe("processBrief", () => {
  it("provider mock -> SUCCESS + kolom kategori/prioritas terisi", async () => {
    process.env.AI_PROVIDER = "mock";
    await processBrief("b1");

    const calls = vi.mocked(prisma.brief.update).mock.calls;
    const last = calls[calls.length - 1][0];
    expect(calls[0][0].data).toEqual({ aiStatus: "PROCESSING" });
    expect(last.where).toEqual({ id: "b1" });
    expect(last.data.aiStatus).toBe("SUCCESS");
    expect(last.data.aiCategory).toBe("WEBSITE");
    expect(typeof last.data.aiPriority).toBe("string");
    expect((last.data.aiResult as { provider: string }).provider).toBe("mock");
    expect(last.data.aiProcessedAt).toBeInstanceOf(Date);
  });

  it("gemini output invalid (setelah retry) -> FAILED + aiError", async () => {
    process.env.AI_PROVIDER = "gemini";
    vi.doMock("@/lib/ai/gemini", () => ({
      InvalidAiOutputError: class extends Error {},
      GEMINI_RESPONSE_SCHEMA: {},
      summarizeWithGemini: vi.fn(async () => {
        throw new Error(
          "Output tidak lolos schema: service_category: Invalid enum value",
        );
      }),
      draftReplyWithGemini: vi.fn(),
    }));
    vi.resetModules();
    // muat ulang modul agar mock @/lib/ai/gemini aktif untuk import barunya
    const { processBrief: fresh } = await import("@/lib/briefs");
    const { prisma: freshPrisma } = await import("@/lib/db");
    vi.mocked(freshPrisma.brief.findUnique).mockResolvedValue(fixture);

    await fresh("b1");

    const calls = vi.mocked(freshPrisma.brief.update).mock.calls;
    const last = calls[calls.length - 1][0];
    expect(last.data.aiStatus).toBe("FAILED");
    expect(last.data.aiError).toContain("schema");
    expect(last.data.aiAttempts).toEqual({ increment: 1 });
    vi.doUnmock("@/lib/ai/gemini");
  });

  it("gemini kena 429/kuota -> fallback mock -> SUCCESS dengan catatan", async () => {
    process.env.AI_PROVIDER = "gemini";
    vi.doMock("@/lib/ai/gemini", () => ({
      InvalidAiOutputError: class extends Error {},
      GEMINI_RESPONSE_SCHEMA: {},
      summarizeWithGemini: vi.fn(async () => {
        throw new Error("429 RESOURCE_EXHAUSTED: quota exceeded");
      }),
      draftReplyWithGemini: vi.fn(),
    }));
    vi.resetModules();
    const { processBrief: fresh } = await import("@/lib/briefs");
    const { prisma: freshPrisma } = await import("@/lib/db");
    vi.mocked(freshPrisma.brief.findUnique).mockResolvedValue(fixture);

    await fresh("b1");

    const calls = vi.mocked(freshPrisma.brief.update).mock.calls;
    const last = calls[calls.length - 1][0];
    expect(last.data.aiStatus).toBe("SUCCESS");
    expect((last.data.aiResult as { provider: string }).provider).toBe("mock");
    expect(String(last.data.aiError)).toContain("Fallback");
    vi.doUnmock("@/lib/ai/gemini");
  });

  it("brief tidak ditemukan -> tidak menyentuh update", async () => {
    vi.mocked(prisma.brief.findUnique).mockResolvedValue(null);
    await processBrief("missing");
    expect(prisma.brief.update).not.toHaveBeenCalled();
  });
});
