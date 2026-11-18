"use client";

import { useState } from "react";
import { BUDGET_LABELS, budgetSchema } from "@/lib/schema";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { buttonClass, inputClass, labelClass } from "@/components/ui/styles";

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

  if (done) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded border-2 border-ink bg-surface p-8 text-center shadow-hard">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-sun text-ink">
            ✓
          </div>
          <h1 className="font-display text-xl font-bold text-ink">
            Brief Anda sudah kami terima
          </h1>
          <p className="mt-2 text-sm text-muted">
            Terima kasih! Tim kami akan meninjau brief Anda dan menghubungi
            Anda lewat email.
          </p>
          <button
            onClick={() => {
              setDone(false);
              setForm(EMPTY);
            }}
            className={buttonClass("secondary", "md", "mt-6")}
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
          <p className="font-display text-sm font-semibold text-ink">
            Briefflow
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
            Ceritakan kebutuhan proyek Anda
          </h1>
          <p className="mt-3 text-sm text-muted">
            Isi form singkat ini — kami akan membalas dengan proposal yang
            sesuai.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded border-2 border-ink bg-surface p-8 shadow-hard"
          noValidate
        >
          {error && (
            <p
              role="alert"
              className="rounded border-2 border-ink bg-[#f2b8b0] px-3 py-2 text-sm text-ink"
            >
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
            <label htmlFor="needs" className={labelClass}>
              Jenis kebutuhan
            </label>
            <textarea
              id="needs"
              value={form.needs}
              onChange={(e) => set("needs", e.target.value)}
              rows={4}
              placeholder="Contoh: rebranding logo dan pembuatan website company profile…"
              aria-invalid={!!fieldErrors.needs?.length}
              aria-describedby={
                fieldErrors.needs?.length ? "needs-error" : undefined
              }
              className={inputClass}
            />
            <FieldError id="needs-error" errors={fieldErrors.needs} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className={labelClass}>Budget</span>
              <Select
                value={form.budget}
                onChange={(v) => set("budget", v)}
                options={budgetSchema.options.map((b) => ({
                  value: b,
                  label: BUDGET_LABELS[b],
                }))}
                placeholder="Pilih rentang…"
                aria-label="Budget"
              />
              <FieldError id="budget-error" errors={fieldErrors.budget} />
            </div>
            <div>
              <span className={labelClass}>Target timeline</span>
              <DatePicker
                value={form.targetTimeline}
                onChange={(v) => set("targetTimeline", v)}
                placeholder="Pilih tanggal…"
              />
              <FieldError
                id="targetTimeline-error"
                errors={fieldErrors.targetTimeline}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className={buttonClass("primary", "md", "w-full")}
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
      <label htmlFor={props.name} className={labelClass}>
        {props.label}
      </label>
      <input
        id={props.name}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        aria-invalid={!!props.errors?.length}
        aria-describedby={props.errors?.length ? `${props.name}-error` : undefined}
        className={inputClass}
      />
      <FieldError id={`${props.name}-error`} errors={props.errors} />
    </div>
  );
}

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-[#c0392b]">
      {errors[0]}
    </p>
  );
}
