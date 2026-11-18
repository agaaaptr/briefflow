import type {
  AiStatus,
  PipelineStatus,
  Priority,
  ServiceCategory,
} from "@/generated/prisma/enums";

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  BRANDING: "Branding",
  WEBSITE: "Website",
  MOBILE_APP: "Mobile App",
  AI_AUTOMATION: "AI Automation",
  SOCIAL_MEDIA: "Social Media",
  LAINNYA: "Lainnya",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  PROPOSAL: "Proposal",
  WON: "Won",
  LOST: "Lost",
};

export const AI_STATUS_LABELS: Record<AiStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SUCCESS: "Success",
  FAILED: "Failed",
};
