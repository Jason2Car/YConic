import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { PERSONALIZATION_SYSTEM_PROMPT } from "@/lib/ai/personalizationRules";

const grok = createOpenAI({ apiKey: process.env.GROK_API_KEY, baseURL: process.env.GROK_BASE_URL });

const PersonalizationPlanSchema = z.object({
  summary: z.string(),
  specs: z.array(z.object({
    sourceModuleId: z.string().nullable(),
    title: z.string(),
    position: z.number(),
    adaptationType: z.enum(["standard", "fast_track", "supplemental", "advanced"]),
    contentDepth: z.enum(["foundational", "standard", "advanced"]),
    language: z.enum(["python", "javascript", "typescript"]).optional(),
    rationale: z.string(),
    type: z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"]),
    adaptedContent: z.any(),
  })),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { enrollmentId, regenerateNote } = await req.json();

  const enrollment = await prisma.joineeEnrollment.findFirst({
    where: { id: enrollmentId, recruiterId: session.user.id },
    include: { sourceProject: { include: { modules: { orderBy: { position: "asc" } } } }, joinee: true },
  });
  if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  if (!enrollment.profile) return NextResponse.json({ error: "Profile not submitted" }, { status: 400 });

  const sourceModuleCount = enrollment.sourceProject.modules.length;
  const maxModules = Math.floor(1.5 * sourceModuleCount);

  const prompt = [
    `Source Project: ${enrollment.sourceProject.title}`,
    `Source Modules:\n${JSON.stringify(enrollment.sourceProject.modules.map((m) => ({ id: m.id, type: m.type, title: m.title, position: m.position, content: m.content })), null, 2)}`,
    `\nJoinee Profile:\n${JSON.stringify(enrollment.profile, null, 2)}`,
    `\nMax total modules allowed: ${maxModules}`,
    regenerateNote ? `\nRecruiter note for regeneration: ${regenerateNote}` : "",
  ].filter(Boolean).join("\n\n");

  try {
    const { object } = await generateObject({
      model: grok(process.env.GROK_MODEL ?? "grok-3"),
      schema: PersonalizationPlanSchema,
      system: PERSONALIZATION_SYSTEM_PROMPT,
      prompt,
    });

    // Enforce module count cap
    let specs = object.specs;
    let summary = object.summary;
    if (specs.length > maxModules) {
      const supplementals = specs.filter((s) => s.adaptationType === "supplemental");
      const nonSupplementals = specs.filter((s) => s.adaptationType !== "supplemental");
      const trimCount = specs.length - maxModules;
      specs = [...nonSupplementals, ...supplementals.slice(0, supplementals.length - trimCount)];
      specs.sort((a, b) => a.position - b.position);
      specs = specs.map((s, i) => ({ ...s, position: i }));
      summary += ` (Note: ${trimCount} supplemental module(s) trimmed to stay within the ${maxModules}-module cap.)`;
    }

    const plan = { summary, specs };

    // Save plan to enrollment
    await prisma.joineeEnrollment.update({
      where: { id: enrollmentId },
      data: { personalizationPlan: plan as unknown as import("@prisma/client").Prisma.InputJsonValue, stage: "PERSONALIZE" },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("AI personalization error:", error);
    return NextResponse.json({ error: "Personalization is temporarily unavailable. The profile has been saved — please try again." }, { status: 500 });
  }
}
