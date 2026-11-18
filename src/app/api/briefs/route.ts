import { NextResponse, after } from "next/server";
import { z } from "zod";
import { createBrief, processBrief } from "@/lib/briefs";
import { rateLimit } from "@/lib/rate-limit";
import { briefSchema } from "@/lib/schema";

// Batas eksekusi fungsi di Vercel (Hobby Fluid Compute max 300s; 60 cukup
// untuk LLM dengan timeout SDK 30s + 1 retry).
export const maxDuration = 60;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi beberapa saat lagi." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const parsed = briefSchema.safeParse(body);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return NextResponse.json(
      { error: "Validasi gagal", fieldErrors },
      { status: 400 },
    );
  }

  let brief;
  try {
    brief = await createBrief(parsed.data);
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan brief. Coba lagi." },
      { status: 500 },
    );
  }

  // Bonus async: proses AI berjalan setelah response terkirim — form tidak
  // menunggu LLM (after() stabil di Route Handler sejak Next 15.1).
  after(async () => {
    await processBrief(brief.id);
  });

  return NextResponse.json({ id: brief.id }, { status: 201 });
}
