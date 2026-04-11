import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";

/** Generate a URL-safe slug from a title + random suffix */
function generateSlug(title: string): string {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50)
        .replace(/^-|-$/g, "");
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base || "project"}-${suffix}`;
}

/** POST /api/projects/:id/publish — publish a project with a unique slug */
export async function POST(_req: Request, { params }: { params: { projectId: string } }) {
    try {
        const project = await prisma.project.findUnique({
            where: { id: params.projectId },
        });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Generate a unique slug with retry
        let slug = "";
        let attempts = 0;
        while (attempts < 5) {
            slug = generateSlug(project.title);
            const existing = await prisma.project.findUnique({ where: { slug } });
            if (!existing) break;
            attempts++;
        }

        if (attempts >= 5) {
            return NextResponse.json({ error: "Failed to generate unique URL" }, { status: 500 });
        }

        const updated = await prisma.project.update({
            where: { id: params.projectId },
            data: { published: true, slug },
            include: { modules: { orderBy: { position: "asc" } } },
        });

        return NextResponse.json({
            slug: updated.slug,
            url: `/p/${updated.slug}`,
            project: updated,
        });
    } catch (error) {
        console.error("Failed to publish project:", error);
        return NextResponse.json({ error: "Failed to publish project" }, { status: 500 });
    }
}
