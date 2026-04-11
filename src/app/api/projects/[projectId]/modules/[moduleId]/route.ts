import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";

const UpdateModuleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.record(z.unknown()).optional(),
  position: z.number().int().min(0).optional(),
  type: z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"]).optional(),
});

/** PUT /api/projects/:projectId/modules/:moduleId — update a module */
export async function PUT(
  req: NextRequest,
  { params }: { params: { projectId: string; moduleId: string } }
) {
  try {
    const existing = await prisma.module.findFirst({
      where: { id: params.moduleId, projectId: params.projectId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = UpdateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.position !== undefined) updateData.position = parsed.data.position;
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
    if (parsed.data.content !== undefined) updateData.content = parsed.data.content as object;

    const mod = await prisma.module.update({
      where: { id: params.moduleId },
      data: updateData,
    });

    return NextResponse.json(mod);
  } catch (error) {
    console.error("Failed to update module:", error);
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }
}

/** DELETE /api/projects/:projectId/modules/:moduleId — delete a module */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { projectId: string; moduleId: string } }
) {
  try {
    const existing = await prisma.module.findFirst({
      where: { id: params.moduleId, projectId: params.projectId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    await prisma.module.delete({ where: { id: params.moduleId } });

    // Re-index positions for remaining modules
    const remaining = await prisma.module.findMany({
      where: { projectId: params.projectId },
      orderBy: { position: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await prisma.module.update({
          where: { id: remaining[i].id },
          data: { position: i },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete module:", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}
