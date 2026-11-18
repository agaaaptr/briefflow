import { requireAuth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b-2 border-ink bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-sm font-bold text-ink">
              Briefflow
            </span>
            <span className="text-xs text-muted">Dashboard internal</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
