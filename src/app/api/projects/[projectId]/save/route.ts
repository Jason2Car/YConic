import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";

// POST /api/projects/:id/save — bulk save project + all modules
export async function POST(req: Request, { params }: { params: { projectId: string } }) {
    try {
        const { title, description, stage, introData, modules } = await req.json();

        // Upsert the project
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
                title: title || "Untitled Project",
                description: description || "",
                stage: stage || "edit",
                introData: introData || null,
            },
        });

        // Replace all modules if provided
        if (modules && Array.isArray(modules)) {
            await prisma.module.deleteMany({ where: { projectId: params.projectId } });
            if (modules.length > 0) {
                await prisma.module.createMany({
                    data: modules.map((m: any, i: number) => ({
                        id: m.id || undefined,
                        projectId: params.projectId,
                        type: m.type || "RICH_TEXT",
                        title: m.title || "Untitled",
                        position: m.position ?? i,
                        content: m.content || {},
                    })),
                });
            }
        }

        const saved = await prisma.project.findUnique({
            where: { id: params.projectId },
            include: { modules: { orderBy: { position: "asc" } } },
        });

        return NextResponse.json(saved);
    } catch (error) {
        console.error("Failed to save project:", error);
        return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
    }
}
