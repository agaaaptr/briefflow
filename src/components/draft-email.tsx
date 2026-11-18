"use client";

import { useActionState, useState } from "react";
import { draftEmail, type DraftState } from "@/app/actions";
import { buttonClass, cardClass } from "@/components/ui/styles";

export function DraftEmail({
  briefId,
  disabled,
}: {
  briefId: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState<
    DraftState | undefined,
    FormData
  >(draftEmail, undefined);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!state?.draft) return;
    await navigator.clipboard.writeText(state.draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className={`${cardClass} p-6`}>
      <h2 className="mb-3 font-display text-sm font-bold text-ink">
        Draft email balasan (AI)
      </h2>
      {disabled ? (
        <p className="text-sm text-muted">
          Tersedia setelah proses AI sukses.
        </p>
      ) : (
        <form action={action}>
          <input type="hidden" name="id" value={briefId} />
          <button
            type="submit"
            disabled={pending}
            className={buttonClass("secondary", "sm")}
          >
            {pending ? "Menulis…" : "Buat draft email"}
          </button>
        </form>
      )}
      {state?.error && (
        <p
          role="alert"
          className="mt-3 rounded border-2 border-ink bg-[#f2b8b0] px-3 py-2 text-sm text-ink"
        >
          {state.error}
        </p>
      )}
      {state?.draft && (
        <div className="mt-3">
          <textarea
            readOnly
            value={state.draft}
            rows={12}
            className="w-full rounded border-2 border-ink bg-surface p-3 text-sm text-ink"
          />
          <button
            type="button"
            onClick={copy}
            className={buttonClass("secondary", "sm", "mt-2")}
          >
            {copied ? "Tersalin ✓" : "Copy"}
          </button>
          <span aria-live="polite" className="sr-only">
            {copied ? "Tersalin ke clipboard" : ""}
          </span>
        </div>
      )}
    </section>
  );
}
