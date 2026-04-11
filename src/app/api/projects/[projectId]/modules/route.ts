import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";

const AddModuleSchema = z.object({
  type: z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"]),
  title: z.string().min(1).max(200),
  position: z.number().int().min(0).optional(),
  content: z.record(z.unknown()).optional(),
});

/** POST /api/projects/:id/modules — add a module */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: { modules: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = AddModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const position = parsed.data.position ?? project.modules.length;

    const mod = await prisma.module.create({
      data: {
        projectId: params.projectId,
        type: parsed.data.type,
        title: parsed.data.title,
        position,
        content: (parsed.data.content ?? {}) as object,
      },
    });

    return NextResponse.json(mod, { status: 201 });
  } catch (error) {
    console.error("Failed to add module:", error);
    return NextResponse.json({ error: "Failed to add module" }, { status: 500 });
  }
}
