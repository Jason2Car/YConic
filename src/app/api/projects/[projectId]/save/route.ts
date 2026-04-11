import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const ModuleSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"]).default("RICH_TEXT"),
  title: z.string().default("Untitled"),
  position: z.number().int().min(0),
  content: z.record(z.unknown()).optional(),
});

const SaveSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  stage: z.enum(["INIT", "INTRO", "EDIT"]).optional(),
  introData: z.record(z.unknown()).nullable().optional(),
  modules: z.array(ModuleSchema).optional(),
});

// POST /api/projects/:id/save — bulk save project + all modules
export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const body = await req.json();
    const parsed = SaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, stage, introData, modules } = parsed.data;

    const project = await prisma.project.upsert({
      where: { id: params.projectId },
      update: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(stage !== undefined && { stage }),
        ...(introData !== undefined && { introData }),
      },
      create: {
        id: params.projectId,
        title: title ?? "Untitled Project",
        description: description ?? "",
        stage: stage ?? "EDIT",
        introData: introData ?? null,
      },
    });

    // Replace all modules if provided
    if (modules) {
      await prisma.module.deleteMany({ where: { projectId: params.projectId } });
      if (modules.length > 0) {
        await prisma.module.createMany({
          data: modules.map((m, i) => ({
            id: m.id,
            projectId: params.projectId,
            type: m.type,
            title: m.title,
            position: m.position ?? i,
            content: (m.content ?? {}) as object,
          })),
        });
      }
    }

    const saved = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: { modules: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(saved ?? project);
  } catch (error) {
    console.error("Failed to save project:", error);
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }
}
