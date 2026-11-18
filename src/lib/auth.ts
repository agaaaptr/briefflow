import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Session = { email?: string };

export async function getSession() {
  return getIronSession<Session>(await cookies(), {
    password: process.env.SESSION_SECRET ?? "",
    cookieName: "briefflow_session",
    // 7 hari
    ttl: 7 * 24 * 3_600,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });
}

/** Guard otoritatif — dipanggil di layout dashboard dan di tiap Server Action. */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session.email) redirect("/login");
  return session;
}
