import { beforeEach, describe, expect, it, vi } from "vitest";

// Rate limit dimatikan agar tiap test independen; Prisma dimock karena
// kasus 400 berhenti sebelum menyentuh DB.
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => true }));
vi.mock("@/lib/db", () => ({
  prisma: {
    brief: {
      create: vi.fn(async () => ({ id: "test-id" })),
      findUnique: vi.fn(async () => undefined),
      update: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
    },
  },
}));
// after() di luar request context Next dieksekusi langsung di test
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (cb: () => unknown) => {
    void cb();
  },
}));

import { POST } from "@/app/api/briefs/route";
import { prisma } from "@/lib/db";

let seq = 0;
function makeRequest(body: unknown) {
  seq += 1;
  return new Request("http://localhost/api/briefs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `10.0.0.${seq}`,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "Aga",
  email: "aga@contoso.com",
  company: "PT Contoso",
  needs: "Pembuatan website company profile",
  budget: "M25_50M",
  targetTimeline: "2099-01-01",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/briefs — validasi server-side", () => {
  it("nama kosong -> 400 + fieldErrors.name", async () => {
    const res = await POST(makeRequest({ ...validBody, name: " " }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.fieldErrors.name[0]).toContain("Nama");
  });

  it("email invalid -> 400 + fieldErrors.email", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "bukan-email" }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.fieldErrors.email[0]).toContain("email");
  });

  it("tanggal masa lalu -> 400 + fieldErrors.targetTimeline", async () => {
    const res = await POST(
      makeRequest({ ...validBody, targetTimeline: "2020-01-01" }),
    );
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.fieldErrors.targetTimeline[0]).toContain("masa lalu");
  });

  it("body valid -> 201 {id} + data tersimpan dengan timeline Date", async () => {
    const res = await POST(makeRequest(validBody));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.id).toBe("test-id");
    expect(prisma.brief.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetTimeline: new Date("2099-01-01T00:00:00Z"),
        budget: "M25_50M",
      }),
    });
  });

  it("body bukan JSON -> 400", async () => {
    seq += 1;
    const res = await POST(
      new Request("http://localhost/api/briefs", {
        method: "POST",
        headers: { "x-forwarded-for": `10.0.0.${seq}` },
        body: "not-json",
      }),
    );
    expect(res.status).toBe(400);
  });
});
