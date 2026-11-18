import type {
  AiStatus,
  PipelineStatus,
  Priority,
} from "@/generated/prisma/enums";
import {
  AI_STATUS_LABELS,
  PIPELINE_LABELS,
  PRIORITY_LABELS,
} from "@/lib/labels";

const STYLES = {
  priority: {
    HIGH: "bg-red-50 text-red-700 border-red-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-slate-100 text-slate-600 border-slate-200",
  },
  ai: {
    PENDING: "bg-slate-100 text-slate-600 border-slate-200",
    PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
    SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
  },
  pipeline: {
    NEW: "bg-blue-50 text-blue-700 border-blue-200",
    CONTACTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    PROPOSAL: "bg-violet-50 text-violet-700 border-violet-200",
    WON: "bg-emerald-50 text-emerald-700 border-emerald-200",
    LOST: "bg-slate-100 text-slate-500 border-slate-200",
  },
} as const;

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ value }: { value: Priority | null }) {
  if (!value) return <span className="text-xs text-slate-400">—</span>;
  return (
    <Badge label={PRIORITY_LABELS[value]} className={STYLES.priority[value]} />
  );
}

export function AiStatusBadge({ value }: { value: AiStatus }) {
  return <Badge label={AI_STATUS_LABELS[value]} className={STYLES.ai[value]} />;
}

export function PipelineBadge({ value }: { value: PipelineStatus }) {
  return (
    <Badge label={PIPELINE_LABELS[value]} className={STYLES.pipeline[value]} />
  );
}
