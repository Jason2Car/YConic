import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateModuleSchema = z.object({
    type: z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"]),
    title: z.string().max(200).default("Untitled Module"),
    content: z.record(z.unknown()).default({}),
    position: z.number().int().min(0).optional(),
});

/** POST /api/projects/:id/modules — add a module */
export async function POST(req: Request, { params }: { params: { projectId: string } }) {
    try {
        const body = await req.json();
        const parsed = CreateModuleSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        let pos = parsed.data.position;
        if (pos === undefined) {
            const last = await prisma.module.findFirst({
                where: { projectId: params.projectId },
                orderBy: { position: "desc" },
            });
            pos = last ? last.position + 1 : 0;
        }

        const mod = await prisma.module.create({
            data: {
                projectId: params.projectId,
                type: parsed.data.type,
                title: parsed.data.title,
                position: pos,
                content: parsed.data.content,
            },
        });
        return NextResponse.json(mod, { status: 201 });
    } catch (error) {
        console.error("Failed to create module:", error);
        return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
    }
}
