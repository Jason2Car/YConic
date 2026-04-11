import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";

// GET /api/projects — list all projects
export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            include: { modules: { orderBy: { position: "asc" } } },
            orderBy: { updatedAt: "desc" },
        });
        return NextResponse.json(projects);
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

// POST /api/projects — create a new project
export async function POST(req: Request) {
    try {
        const { title, description } = await req.json();
        const project = await prisma.project.create({
            data: {
                title: title || "Untitled Project",
                description: description || "",
                stage: "edit",
            },
            include: { modules: true },
        });
        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("Failed to create project:", error);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
