"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(
    login,
    undefined,
  );

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase">
            Briefflow
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Login Admin
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Dashboard internal tim sales.
          </p>
        </header>

        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {pending ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}
