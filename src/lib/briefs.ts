import { prisma } from "@/lib/db";
import type { BriefInput } from "@/lib/schema";

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
