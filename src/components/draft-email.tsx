"use client";

import { useActionState, useState } from "react";
import { draftEmail, type DraftState } from "@/app/actions";

export function DraftEmail({
  briefId,
  disabled,
}: {
  briefId: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState<DraftState | undefined, FormData>(
    draftEmail,
    undefined,
  );
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!state?.draft) return;
    await navigator.clipboard.writeText(state.draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
        Draft email balasan (AI)
      </h2>
      {disabled ? (
        <p className="text-sm text-slate-500">
          Tersedia setelah proses AI sukses.
        </p>
      ) : (
        <form action={action}>
          <input type="hidden" name="id" value={briefId} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
          >
            {pending ? "Menulis…" : "Buat draft email"}
          </button>
        </form>
      )}
      {state?.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.draft && (
        <div className="mt-3">
          <textarea
            readOnly
            value={state.draft}
            rows={12}
            className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-800"
          />
          <button
            type="button"
            onClick={copy}
            className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            {copied ? "Tersalin ✓" : "Copy"}
          </button>
        </div>
      )}
    </section>
  );
}
