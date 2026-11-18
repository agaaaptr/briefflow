import Link from "next/link";
import {
  AiStatusBadge,
  PipelineBadge,
  PriorityBadge,
} from "@/components/badges";
import { AutoRefresh } from "@/components/auto-refresh";
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
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Brief masuk
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {briefs.length} brief · terbaru dulu
          </p>
        </div>

        {/* Filter server-side: nilai enum lewat URL, bisa dikombinasi */}
        <form className="flex flex-wrap items-end gap-2" method="get">
          <div>
            <label
              htmlFor="priority"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              Prioritas
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue={filter.priority ?? ""}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
            >
              <option value="">Semua</option>
              {(["HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="category"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              Kategori
            </label>
            <select
              id="category"
              name="category"
              defaultValue={filter.category ?? ""}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
            >
              <option value="">Semua</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Terapkan
          </button>
          {activeFilter && (
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Reset
            </Link>
          )}
        </form>
      </div>

      {briefs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          {activeFilter
            ? "Tidak ada brief yang cocok dengan filter."
            : "Belum ada brief masuk."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Perusahaan</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Prioritas</th>
                <th className="px-4 py-3 font-medium">Status AI</th>
                <th className="px-4 py-3 font-medium">Pipeline</th>
                <th className="px-4 py-3 font-medium">Tanggal masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {briefs.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/briefs/${b.id}`}
                      className="font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {b.company}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
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
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
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
