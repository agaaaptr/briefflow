import Link from "next/link";
import { notFound } from "next/navigation";
import { reprocessBrief, setPipeline } from "@/app/actions";
import {
  AiStatusBadge,
  PipelineBadge,
  PriorityBadge,
} from "@/components/badges";
import { AutoRefresh } from "@/components/auto-refresh";
import { DraftEmail } from "@/components/draft-email";
import { Select } from "@/components/ui/select";
import { buttonClass, cardClass } from "@/components/ui/styles";
import { getBrief } from "@/lib/briefs";
import { PIPELINE_LABELS } from "@/lib/labels";
import { BUDGET_LABELS, aiResultSchema } from "@/lib/schema";
import type { Priority } from "@/generated/prisma/enums";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

const PRIORITY_ENUM: Record<string, Priority> = {
  High: "HIGH",
  Medium: "MEDIUM",
  Low: "LOW",
};

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
  const processing =
    brief.aiStatus === "PENDING" || brief.aiStatus === "PROCESSING";

  return (
    <div className="space-y-6">
      <AutoRefresh active={processing} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-ink underline underline-offset-2"
          >
            ← Kembali ke daftar
          </Link>
          <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">
            {brief.company}
          </h1>
          <p className="text-sm text-muted">
            Masuk {dateFmt.format(brief.createdAt)} · {brief.aiAttempts}× proses
            AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AiStatusBadge value={brief.aiStatus} />
          <PipelineBadge value={brief.pipelineStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Data asli dari form */}
        <section className={`${cardClass} p-6`}>
          <h2 className="mb-4 font-display text-sm font-bold text-ink">
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
              <dt className="text-xs font-medium text-muted">Jenis kebutuhan</dt>
              <dd className="mt-1 whitespace-pre-wrap text-ink">
                {brief.needs}
              </dd>
            </div>
          </dl>
        </section>

        {/* Hasil AI */}
        <section className={`${cardClass} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-ink">
              Hasil AI
            </h2>
            <form action={reprocessBrief}>
              <input type="hidden" name="id" value={brief.id} />
              <button type="submit" className={buttonClass("secondary", "sm")}>
                Proses ulang AI
              </button>
            </form>
          </div>

          {processing && (
            <p className="text-sm text-muted">
              Brief sedang diproses AI… halaman menyegarkan otomatis.
            </p>
          )}

          {brief.aiStatus === "FAILED" && (
            <div
              role="alert"
              className="rounded border-2 border-ink bg-[#f2b8b0] p-3 text-sm text-ink"
            >
              <p className="font-semibold">Proses AI gagal:</p>
              <p className="mt-1 break-words">{brief.aiError}</p>
              <p className="mt-1 text-xs text-muted">
                Klik “Proses ulang AI” untuk mencoba lagi.
              </p>
            </div>
          )}

          {ai.success && (
            <div className="space-y-3 text-sm">
              <p className="text-ink">{ai.data.summary}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-ink/30 bg-[#e5e0d0] px-2.5 py-0.5 text-xs font-semibold text-ink">
                  {ai.data.service_category}
                </span>
                <PriorityBadge
                  value={PRIORITY_ENUM[ai.data.priority] ?? null}
                />
              </div>
              <Row label="Alasan prioritas" value={ai.data.priority_reason} />
              {ai.data.missing_info.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted">
                    Informasi yang masih kurang
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink">
                    {ai.data.missing_info.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="border-t border-line pt-2 text-xs text-muted">
                provider: {meta.provider} · model: {meta.model}
                {meta.note ? ` · ${meta.note}` : ""}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Pipeline status */}
      <section className={`${cardClass} p-6`}>
        <h2 className="mb-3 font-display text-sm font-bold text-ink">
          Pipeline
        </h2>
        <form action={setPipeline} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={brief.id} />
          <div className="w-44">
            <span className="mb-1 block text-xs font-semibold text-muted">
              Status
            </span>
            <Select
              key={brief.pipelineStatus}
              name="status"
              defaultValue={brief.pipelineStatus}
              aria-label="Status pipeline"
              options={(
                ["NEW", "CONTACTED", "PROPOSAL", "WON", "LOST"] as const
              ).map((s) => ({ value: s, label: PIPELINE_LABELS[s] }))}
            />
          </div>
          <button type="submit" className={buttonClass("primary", "sm")}>
            Simpan
          </button>
        </form>
      </section>

      <DraftEmail briefId={brief.id} disabled={brief.aiStatus !== "SUCCESS"} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-xs font-medium text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
