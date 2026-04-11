import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateProjectSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).default(""),
});

/** GET /api/projects — list all projects */
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

/** POST /api/projects — create a new project */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = CreateProjectSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const project = await prisma.project.create({
            data: {
                title: parsed.data.title,
                description: parsed.data.description,
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
