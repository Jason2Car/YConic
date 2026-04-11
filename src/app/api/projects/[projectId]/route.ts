import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";

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

export async function PUT(req: Request, { params }: { params: { projectId: string } }) {
    try {
        const data = await req.json();
        const project = await prisma.project.update({
            where: { id: params.projectId },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.stage !== undefined && { stage: data.stage }),
                ...(data.published !== undefined && { published: data.published }),
                ...(data.slug !== undefined && { slug: data.slug }),
                ...(data.introData !== undefined && { introData: data.introData }),
            },
            include: { modules: { orderBy: { position: "asc" } } },
        });
        return NextResponse.json(project);
    } catch (error) {
        console.error("Failed to update project:", error);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: { projectId: string } }) {
    try {
        await prisma.project.delete({ where: { id: params.projectId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete project:", error);
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
