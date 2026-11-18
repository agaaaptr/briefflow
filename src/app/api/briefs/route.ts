import { NextResponse } from "next/server";
import { z } from "zod";
import { createBrief, processBrief } from "@/lib/briefs";
import { rateLimit } from "@/lib/rate-limit";
import { briefSchema } from "@/lib/schema";

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

  // T4: diproses langsung (awaited). T5 memindahkan ini ke after() agar
  // response tidak menunggu LLM.
  await processBrief(brief.id);

  return NextResponse.json({ id: brief.id }, { status: 201 });
}
