"use server";

import { compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAuth, getSession } from "@/lib/auth";
import { generateReplyDraft } from "@/lib/ai";
import { getBrief, processBrief, setPipelineStatus } from "@/lib/briefs";
import { aiResultSchema } from "@/lib/schema";
import type { PipelineStatus } from "@/generated/prisma/enums";

export type LoginState = { error?: string };
export type DraftState = { draft?: string; error?: string };

export async function login(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const expectedEmail = process.env.ADMIN_EMAIL;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedEmail || !hash) {
    return { error: "Konfigurasi admin belum lengkap (cek env)." };
  }

  const emailOk = email === expectedEmail;
  const passwordOk = await compare(password, hash);
  if (!emailOk || !passwordOk) {
    return { error: "Email atau password salah." };
  }

  const session = await getSession();
  session.email = email;
  await session.save();

  redirect("/dashboard");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

const PIPELINE_VALUES: PipelineStatus[] = [
  "NEW",
  "CONTACTED",
  "PROPOSAL",
  "WON",
  "LOST",
];

export async function setPipeline(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as PipelineStatus;
  if (!id || !PIPELINE_VALUES.includes(status)) return;

  await setPipelineStatus(id, status);
  revalidatePath(`/dashboard/briefs/${id}`);
  revalidatePath("/dashboard");
}

export async function reprocessBrief(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // tandai PROCESSING agar UI langsung jujur; LLM jalan pasca-response
  const { prisma } = await import("@/lib/db");
  await prisma.brief.update({ where: { id }, data: { aiStatus: "PROCESSING" } });
  after(async () => {
    await processBrief(id);
  });
  revalidatePath(`/dashboard/briefs/${id}`);
  revalidatePath("/dashboard");
}

export async function draftEmail(
  _prev: DraftState | undefined,
  formData: FormData,
): Promise<DraftState> {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const brief = await getBrief(id);
  if (!brief) return { error: "Brief tidak ditemukan." };
  if (brief.aiStatus !== "SUCCESS") {
    return { error: "Proses AI harus sukses sebelum membuat draft email." };
  }
  const ai = aiResultSchema.safeParse(brief.aiResult);
  if (!ai.success) {
    return { error: "Hasil AI tidak valid — jalankan proses ulang dulu." };
  }
  try {
    const { draft } = await generateReplyDraft({
      name: brief.name,
      company: brief.company,
      summary: ai.data.summary,
      missingInfo: ai.data.missing_info,
    });
    return { draft };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal membuat draft.",
    };
  }
}
