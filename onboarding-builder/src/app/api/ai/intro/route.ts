import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { INTRO_SYSTEM_PROMPT } from "@/lib/ai/introRules";
import { fetchRepoContent } from "@/lib/github";

const grok = createOpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: process.env.GROK_BASE_URL,
});

const ModuleStubSchema = z.object({
  modules: z.array(z.object({
    type: z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"]),
    title: z.string(),
    description: z.string(),
  })),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, goals, baseline, repoUrl, githubToken } = await req.json();

  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Fetch repo content if provided
  let repoContext = "";
  if (repoUrl) {
    repoContext = await fetchRepoContent(repoUrl, githubToken);
  }

  const userMessage = [
    `Onboarding Goals: ${goals}`,
    baseline ? `Baseline Requirements: ${baseline}` : "",
    repoContext ? `\nCodebase Summary:\n${repoContext}` : "",
  ].filter(Boolean).join("\n\n");

  try {
    const { object } = await generateObject({
      model: grok(process.env.GROK_MODEL ?? "grok-3"),
      schema: ModuleStubSchema,
      system: INTRO_SYSTEM_PROMPT,
      prompt: userMessage,
    });

    // Write modules to DB
    await prisma.module.createMany({
      data: object.modules.map((m, i) => ({
        projectId,
        type: m.type,
        title: m.title,
        position: i,
        content: { type: m.type, description: m.description },
      })),
    });

    // Update project stage and save intro data
    await prisma.project.update({
      where: { id: projectId },
      data: { stage: "EDIT", introData: { goals, baseline, repoUrl } },
    });

    return NextResponse.json({ success: true, modules: object.modules });
  } catch (error) {
    console.error("AI intro error:", error);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
