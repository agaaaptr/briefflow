import Link from "next/link";
import {
  AiStatusBadge,
  PipelineBadge,
  PriorityBadge,
} from "@/components/badges";
import { AutoRefresh } from "@/components/auto-refresh";
import { Select } from "@/components/ui/select";
import { buttonClass } from "@/components/ui/styles";
import { listBriefs, parseFilter } from "@/lib/briefs";
import { CATEGORY_LABELS, PRIORITY_LABELS } from "@/lib/labels";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ priority?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const filter = parseFilter(sp);
  const briefs = await listBriefs(filter);

  const activeFilter = filter.priority || filter.category;

  return (
    <div>
      <AutoRefresh
        active={briefs.some(
          (b) => b.aiStatus === "PENDING" || b.aiStatus === "PROCESSING",
        )}
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink">
            Brief masuk
          </h1>
          <p className="mt-1 text-sm text-muted" role="status">
            {briefs.length} brief · terbaru dulu
          </p>
        </div>

        {/* Filter server-side: nilai enum lewat URL, bisa dikombinasi */}
        <form className="flex flex-wrap items-end gap-2" method="get">
          <div className="w-36">
            <span className="mb-1 block text-xs font-semibold text-muted">
              Prioritas
            </span>
            <Select
              name="priority"
              defaultValue={filter.priority ?? ""}
              placeholder="Semua"
              aria-label="Filter prioritas"
              options={(["HIGH", "MEDIUM", "LOW"] as const).map((p) => ({
                value: p,
                label: PRIORITY_LABELS[p],
              }))}
            />
          </div>
          <div className="w-44">
            <span className="mb-1 block text-xs font-semibold text-muted">
              Kategori
            </span>
            <Select
              name="category"
              defaultValue={filter.category ?? ""}
              placeholder="Semua"
              aria-label="Filter kategori"
              options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
          <button type="submit" className={buttonClass("primary", "sm")}>
            Terapkan
          </button>
          {activeFilter && (
            <Link href="/dashboard" className={buttonClass("secondary", "sm")}>
              Reset
            </Link>
          )}
        </form>
      </div>

      {briefs.length === 0 ? (
        <div className="rounded border-2 border-dashed border-ink/30 bg-surface p-12 text-center text-sm text-muted">
          {activeFilter
            ? "Tidak ada brief yang cocok dengan filter."
            : "Belum ada brief masuk."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded border-2 border-ink bg-surface">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Daftar brief masuk</caption>
            <thead className="border-b-2 border-ink bg-wash text-xs font-semibold text-ink">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Perusahaan
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Kategori
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Prioritas
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status AI
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Pipeline
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Tanggal masuk
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {briefs.map((b) => (
                <tr key={b.id} className="hover:bg-wash">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/briefs/${b.id}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {b.company}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {b.aiCategory ? CATEGORY_LABELS[b.aiCategory] : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge value={b.aiPriority} />
                  </td>
                  <td className="px-4 py-3">
                    <AiStatusBadge value={b.aiStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <PipelineBadge value={b.pipelineStatus} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {dateFmt.format(b.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
