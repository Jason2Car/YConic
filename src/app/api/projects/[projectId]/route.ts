import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const UpdateProjectSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    stage: z.enum(["init", "intro", "edit"]).optional(),
    published: z.boolean().optional(),
    slug: z.string().max(300).optional(),
}).strict();

/** GET /api/projects/:id — get project with modules */
export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
    try {
        const project = await prisma.project.findUnique({
            where: { id: params.projectId },
            include: { modules: { orderBy: { position: "asc" } } },
        });
        if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(project);
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
}

/** PUT /api/projects/:id — update project metadata */
export async function PUT(req: Request, { params }: { params: { projectId: string } }) {
    try {
        const body = await req.json();
        const parsed = UpdateProjectSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const project = await prisma.project.update({
            where: { id: params.projectId },
            data: parsed.data,
            include: { modules: { orderBy: { position: "asc" } } },
        });
        return NextResponse.json(project);
    } catch (error) {
        console.error("Failed to update project:", error);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}

/** DELETE /api/projects/:id */
export async function DELETE(_req: Request, { params }: { params: { projectId: string } }) {
    try {
        await prisma.project.delete({ where: { id: params.projectId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete project:", error);
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
