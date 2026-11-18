import { describe, expect, it } from "vitest";
import { GEMINI_RESPONSE_SCHEMA } from "@/lib/ai/gemini";
import {
  PRIORITIES,
  SERVICE_CATEGORIES,
  aiResultSchema,
} from "@/lib/schema";

const valid = {
  summary: "Klien butuh website company profile.",
  service_category: "Website",
  priority: "High",
  priority_reason: "Budget besar dan timeline dekat.",
  missing_info: ["jumlah halaman"],
};

describe("aiResultSchema (validasi output AI)", () => {
  it("menerima payload valid", () => {
    expect(aiResultSchema.safeParse(valid).success).toBe(true);
  });

  it("menolak nilai enum service_category di luar daftar", () => {
    const r = aiResultSchema.safeParse({
      ...valid,
      service_category: "Photography",
    });
    expect(r.success).toBe(false);
  });

  it("menolak priority di luar daftar", () => {
    const r = aiResultSchema.safeParse({ ...valid, priority: "Urgent" });
    expect(r.success).toBe(false);
  });

  it("menolak field wajib yang hilang (priority_reason)", () => {
    const { priority_reason: _omit, ...rest } = valid;
    const r = aiResultSchema.safeParse(rest);
    expect(r.success).toBe(false);
  });

  it("menolak missing_info yang bukan array", () => {
    const r = aiResultSchema.safeParse({ ...valid, missing_info: "detail" });
    expect(r.success).toBe(false);
  });
});

describe("konsistensi GEMINI_RESPONSE_SCHEMA vs aiResultSchema", () => {
  it("enum service_category identik dengan zod", () => {
    expect(
      GEMINI_RESPONSE_SCHEMA.properties.service_category.enum,
    ).toEqual([...SERVICE_CATEGORIES]);
  });

  it("enum priority identik dengan zod", () => {
    expect(GEMINI_RESPONSE_SCHEMA.properties.priority.enum).toEqual([
      ...PRIORITIES,
    ]);
  });

  it("required fields sama dengan field schema zod", () => {
    expect([...GEMINI_RESPONSE_SCHEMA.required].sort()).toEqual(
      Object.keys(valid).sort(),
    );
  });
});
