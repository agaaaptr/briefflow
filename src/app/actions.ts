"use server";

import { compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAuth, getSession } from "@/lib/auth";
import { processBrief, setPipelineStatus } from "@/lib/briefs";
import type { PipelineStatus } from "@/generated/prisma/enums";

export type LoginState = { error?: string };

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
