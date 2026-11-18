"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

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
