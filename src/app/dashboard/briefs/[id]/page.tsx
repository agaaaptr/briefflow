import Link from "next/link";
import { notFound } from "next/navigation";
import { reprocessBrief, setPipeline } from "@/app/actions";
import { AiStatusBadge, PipelineBadge } from "@/components/badges";
import { AutoRefresh } from "@/components/auto-refresh";
import { getBrief } from "@/lib/briefs";
import { PIPELINE_LABELS } from "@/lib/labels";
import { BUDGET_LABELS, aiResultSchema } from "@/lib/schema";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

export default async function BriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brief = await getBrief(id);
  if (!brief) notFound();

  const ai = aiResultSchema.safeParse(brief.aiResult);
  const meta = (brief.aiResult ?? {}) as {
    provider?: string;
    model?: string;
    note?: string;
  };
  const processing = brief.aiStatus === "PENDING" || brief.aiStatus === "PROCESSING";

  return (
    <div className="space-y-6">
      <AutoRefresh active={processing} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            ← Kembali ke daftar
          </Link>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {brief.company}
          </h1>
          <p className="text-sm text-slate-500">
            Masuk {dateFmt.format(brief.createdAt)} · {brief.aiAttempts}× proses AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AiStatusBadge value={brief.aiStatus} />
          <PipelineBadge value={brief.pipelineStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Data asli dari form */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Data brief (form)
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="Nama" value={brief.name} />
            <Row label="Email" value={brief.email} />
            <Row label="Perusahaan" value={brief.company} />
            <Row label="Budget" value={BUDGET_LABELS[brief.budget]} />
            <Row
              label="Target timeline"
              value={brief.targetTimeline.toISOString().slice(0, 10)}
            />
            <div>
              <dt className="text-xs font-medium text-slate-500">Jenis kebutuhan</dt>
              <dd className="mt-1 whitespace-pre-wrap text-slate-900">
                {brief.needs}
              </dd>
            </div>
          </dl>
        </section>

        {/* Hasil AI */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Hasil AI
            </h2>
            <form action={reprocessBrief}>
              <input type="hidden" name="id" value={brief.id} />
              <button
                type="submit"
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Proses ulang AI
              </button>
            </form>
          </div>

          {processing && (
            <p className="text-sm text-slate-500">
              Brief sedang diproses AI… halaman menyegarkan otomatis.
            </p>
          )}

          {brief.aiStatus === "FAILED" && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">Proses AI gagal:</p>
              <p className="mt-1 break-words">{brief.aiError}</p>
              <p className="mt-1 text-xs text-red-600">
                Klik “Proses ulang AI” untuk mencoba lagi.
              </p>
            </div>
          )}

          {ai.success && (
            <div className="space-y-3 text-sm">
              <p className="text-slate-900">{ai.data.summary}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {ai.data.service_category}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                    ai.data.priority === "High"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : ai.data.priority === "Medium"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {ai.data.priority}
                </span>
              </div>
              <Row label="Alasan prioritas" value={ai.data.priority_reason} />
              {ai.data.missing_info.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Informasi yang masih kurang
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-700">
                    {ai.data.missing_info.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="border-t border-slate-100 pt-2 text-xs text-slate-400">
                provider: {meta.provider} · model: {meta.model}
                {meta.note ? ` · ${meta.note}` : ""}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Pipeline status */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Pipeline
        </h2>
        <form action={setPipeline} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={brief.id} />
          <div>
            <label
              htmlFor="status"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={brief.pipelineStatus}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            >
              {(
                ["NEW", "CONTACTED", "PROPOSAL", "WON", "LOST"] as const
              ).map((s) => (
                <option key={s} value={s}>
                  {PIPELINE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Simpan
          </button>
        </form>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-xs font-medium text-slate-500">
        {label}
      </dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );
}
