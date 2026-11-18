import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    brief: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { listBriefs, parseFilter } from "@/lib/briefs";
import { prisma } from "@/lib/db";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseFilter", () => {
  it("menerima kombinasi priority + category", () => {
    expect(
      parseFilter({ priority: "HIGH", category: "BRANDING" }),
    ).toEqual({ priority: "HIGH", category: "BRANDING" });
  });

  it("menerima masing-masing sendiri", () => {
    expect(parseFilter({ priority: "LOW" })).toEqual({ priority: "LOW" });
    expect(parseFilter({ category: "WEBSITE" })).toEqual({
      category: "WEBSITE",
    });
  });

  it("mengabaikan nilai tak dikenal", () => {
    expect(
      parseFilter({ priority: "URGENT", category: "Photography" }),
    ).toEqual({});
  });

  it("kosong -> tanpa filter", () => {
    expect(parseFilter({})).toEqual({});
  });
});

describe("listBriefs (query filter)", () => {
  it("kombinasi HIGH+BRANDING -> where gabungan, urut terbaru", async () => {
    await listBriefs({ priority: "HIGH", category: "BRANDING" });
    expect(prisma.brief.findMany).toHaveBeenCalledWith({
      where: { aiPriority: "HIGH", aiCategory: "BRANDING" },
      orderBy: { createdAt: "desc" },
      select: expect.objectContaining({ company: true, aiPriority: true }),
    });
  });

  it("tanpa filter -> where kosong", async () => {
    await listBriefs();
    expect(prisma.brief.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});
