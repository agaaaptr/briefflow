"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions";
import { buttonClass, inputClass, labelClass } from "@/components/ui/styles";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<
    LoginState | undefined,
    FormData
  >(login, undefined);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <p className="font-display text-sm font-semibold text-ink">
            Briefflow
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
            Login Admin
          </h1>
          <p className="mt-2 text-sm text-muted">
            Dashboard internal tim sales.
          </p>
        </header>

        <form
          action={formAction}
          className="space-y-4 rounded border-2 border-ink bg-surface p-8"
          noValidate
        >
          {state?.error && (
            <p
              role="alert"
              className="rounded border-2 border-ink bg-[#f2b8b0] px-3 py-2 text-sm text-ink"
            >
              {state.error}
            </p>
          )}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className={buttonClass("primary", "md", "w-full")}
          >
            {pending ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}
