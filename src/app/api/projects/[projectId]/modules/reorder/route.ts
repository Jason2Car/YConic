import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";

const ReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)),
});

/** PUT /api/projects/:id/modules/reorder — reorder modules */
export async function PUT(
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
    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderedIds } = parsed.data;
    const existingIds = new Set(project.modules.map((m) => m.id));

    // Validate all IDs belong to this project
    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        return NextResponse.json(
          { error: `Module ${id} does not belong to this project` },
          { status: 400 }
        );
      }
    }

    // Update positions
    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.module.update({
        where: { id: orderedIds[i] },
        data: { position: i },
      });
    }

    const modules = await prisma.module.findMany({
      where: { projectId: params.projectId },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error("Failed to reorder modules:", error);
    return NextResponse.json({ error: "Failed to reorder modules" }, { status: 500 });
  }
}
