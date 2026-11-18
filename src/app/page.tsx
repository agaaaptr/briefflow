"use client";

import { useState } from "react";
import { BUDGET_LABELS, budgetSchema } from "@/lib/schema";

type FieldErrors = Record<string, string[]>;

const EMPTY = {
  name: "",
  email: "",
  company: "",
  needs: "",
  budget: "",
  targetTimeline: "",
};

export default function Home() {
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setFieldErrors({});
    try {
      const res = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        fieldErrors?: FieldErrors;
      };
      if (res.status === 201) {
        setDone(true);
        return;
      }
      setError(data.error ?? "Gagal mengirim brief.");
      setFieldErrors(data.fieldErrors ?? {});
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  if (done) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white">
            ✓
          </div>
          <h1 className="text-xl font-semibold text-emerald-900">
            Brief Anda sudah kami terima
          </h1>
          <p className="mt-2 text-sm text-emerald-800">
            Terima kasih! Tim kami akan meninjau brief Anda dan menghubungi
            Anda lewat email.
          </p>
          <button
            onClick={() => {
              setDone(false);
              setForm(EMPTY);
            }}
            className="mt-6 rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
          >
            Kirim brief lain
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase">
            Briefflow
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Ceritakan kebutuhan proyek Anda
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Isi form singkat ini — kami akan membalas dengan proposal yang
            sesuai.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
          noValidate
        >
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Field
            label="Nama"
            name="name"
            value={form.name}
            onChange={(v) => set("name", v)}
            errors={fieldErrors.name}
            placeholder="Nama lengkap"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(v) => set("email", v)}
            errors={fieldErrors.email}
            placeholder="nama@perusahaan.com"
          />
          <Field
            label="Nama perusahaan"
            name="company"
            value={form.company}
            onChange={(v) => set("company", v)}
            errors={fieldErrors.company}
            placeholder="PT Contoh Sejahtera"
          />

          <div>
            <label
              htmlFor="needs"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Jenis kebutuhan
            </label>
            <textarea
              id="needs"
              value={form.needs}
              onChange={(e) => set("needs", e.target.value)}
              rows={4}
              placeholder="Contoh: rebranding logo dan pembuatan website company profile…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
            <FieldError errors={fieldErrors.needs} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="budget"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Budget
              </label>
              <select
                id="budget"
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              >
                <option value="">Pilih rentang…</option>
                {budgetSchema.options.map((b) => (
                  <option key={b} value={b}>
                    {BUDGET_LABELS[b]}
                  </option>
                ))}
              </select>
              <FieldError errors={fieldErrors.budget} />
            </div>
            <div>
              <label
                htmlFor="targetTimeline"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Target timeline
              </label>
              <input
                id="targetTimeline"
                type="date"
                min={todayIso}
                value={form.targetTimeline}
                onChange={(e) => set("targetTimeline", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
              <FieldError errors={fieldErrors.targetTimeline} />
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {sending ? "Mengirim…" : "Kirim Brief"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={props.name}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {props.label}
      </label>
      <input
        id={props.name}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
      />
      <FieldError errors={props.errors} />
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{errors[0]}</p>;
}
