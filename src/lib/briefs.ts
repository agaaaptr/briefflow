import { prisma } from "@/lib/db";
import { generateBriefSummary } from "@/lib/ai";
import type { AiResult, BriefInput } from "@/lib/schema";
import type { Priority, ServiceCategory } from "@/generated/prisma/enums";

export async function createBrief(input: BriefInput) {
  return prisma.brief.create({
    data: {
      name: input.name,
      email: input.email,
      company: input.company,
      needs: input.needs,
      budget: input.budget,
      targetTimeline: new Date(`${input.targetTimeline}T00:00:00Z`),
    },
  });
}

const CATEGORY_TO_ENUM: Record<AiResult["service_category"], ServiceCategory> = {
  Branding: "BRANDING",
  Website: "WEBSITE",
  "Mobile App": "MOBILE_APP",
  "AI Automation": "AI_AUTOMATION",
  "Social Media": "SOCIAL_MEDIA",
  Lainnya: "LAINNYA",
};

const PRIORITY_TO_ENUM: Record<AiResult["priority"], Priority> = {
  High: "HIGH",
  Medium: "MEDIUM",
  Low: "LOW",
};

/**
 * Memproses satu brief dengan AI dan menulis hasilnya (SUCCESS/FAILED).
 * Tidak melempar error — semua kegagalan tercatat di row (bisa diproses ulang).
 */
export async function processBrief(id: string): Promise<void> {
  const brief = await prisma.brief.findUnique({ where: { id } });
  if (!brief) return;

  await prisma.brief.update({ where: { id }, data: { aiStatus: "PROCESSING" } });

  try {
    const outcome = await generateBriefSummary({
      needs: brief.needs,
      budget: brief.budget,
      targetTimeline: brief.targetTimeline.toISOString().slice(0, 10),
    });
    await prisma.brief.update({
      where: { id },
      data: {
        aiStatus: "SUCCESS",
        aiCategory: CATEGORY_TO_ENUM[outcome.data.service_category],
        aiPriority: PRIORITY_TO_ENUM[outcome.data.priority],
        aiResult: {
          ...outcome.data,
          provider: outcome.provider,
          model: outcome.model,
          ...(outcome.note ? { note: outcome.note } : {}),
        },
        aiError: outcome.note ?? null,
        aiAttempts: { increment: 1 },
        aiProcessedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.brief.update({
      where: { id },
      data: {
        aiStatus: "FAILED",
        aiError: err instanceof Error ? err.message : String(err),
        aiAttempts: { increment: 1 },
        aiProcessedAt: new Date(),
      },
    });
  }
}
