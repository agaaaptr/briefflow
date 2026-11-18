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
    HIGH: "bg-[#f2b8b0] text-ink border-ink/30",
    MEDIUM: "bg-[#ffe08a] text-ink border-ink/30",
    LOW: "bg-[#e5e0d0] text-ink border-ink/30",
  },
  ai: {
    PENDING: "bg-[#e5e0d0] text-ink border-ink/30",
    PROCESSING: "bg-[#bbd6f5] text-ink border-ink/30 animate-pulse",
    SUCCESS: "bg-[#b7e6c3] text-ink border-ink/30",
    FAILED: "bg-[#f2b8b0] text-ink border-ink/30",
  },
  pipeline: {
    NEW: "bg-[#bbd6f5] text-ink border-ink/30",
    CONTACTED: "bg-[#d6c9f5] text-ink border-ink/30",
    PROPOSAL: "bg-[#ffe08a] text-ink border-ink/30",
    WON: "bg-[#b7e6c3] text-ink border-ink/30",
    LOST: "bg-[#e5e0d0] text-ink border-ink/30",
  },
} as const;

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ value }: { value: Priority | null }) {
  if (!value) return <span className="text-xs text-muted">—</span>;
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
