"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polling ringan: refresh server components tiap 2s selama ada brief yang
 * masih PENDING/PROCESSING — tanpa library tambahan.
 */
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(t);
  }, [active, router]);
  return null;
}
