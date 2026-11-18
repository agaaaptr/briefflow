import { describe, expect, it } from "vitest";
import { buildMonthGrid, isPast, parseIso, toIso } from "@/lib/calendar";

describe("buildMonthGrid (Senin-awal)", () => {
  it("Feb 2026 (1 Feb = Minggu) -> 6 sel kosong di awal", () => {
    const grid = buildMonthGrid(2026, 1);
    expect(grid.length % 7).toBe(0);
    expect(grid.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(grid[6]).toEqual(new Date(2026, 1, 1));
  });

  it("menghasilkan tepat 28 hari untuk Feb 2026", () => {
    const days = buildMonthGrid(2026, 1).filter(Boolean);
    expect(days.length).toBe(28);
  });
});

describe("isPast", () => {
  it("hari sebelum today = masa lalu, hari ini/besok tidak", () => {
    const today = new Date(2026, 10, 18);
    expect(isPast(new Date(2026, 10, 17), today)).toBe(true);
    expect(isPast(new Date(2026, 10, 18), today)).toBe(false);
    expect(isPast(new Date(2026, 10, 19), today)).toBe(false);
  });
});

describe("parseIso / toIso", () => {
  it("parse iso valid", () => {
    expect(parseIso("2026-11-18")).toEqual(new Date(2026, 10, 18));
  });

  it("menolak tanggal tidak valid", () => {
    expect(parseIso("2026-02-30")).toBeNull();
    expect(parseIso("18-11-2026")).toBeNull();
  });

  it("toIso menghasilkan format YYYY-MM-DD", () => {
    expect(toIso(new Date(2026, 10, 18))).toBe("2026-11-18");
  });
});
