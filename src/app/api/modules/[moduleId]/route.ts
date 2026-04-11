import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const UpdateModuleSchema = z.object({
    title: z.string().max(200).optional(),
    content: z.record(z.unknown()).optional(),
    type: z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"]).optional(),
    position: z.number().int().min(0).optional(),
}).strict();

/** PUT /api/modules/:id — update a module */
export async function PUT(req: Request, { params }: { params: { moduleId: string } }) {
    try {
        const body = await req.json();
        const parsed = UpdateModuleSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const mod = await prisma.module.update({
            where: { id: params.moduleId },
            data: parsed.data,
        });
        return NextResponse.json(mod);
    } catch (error) {
        console.error("Failed to update module:", error);
        return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
    }
}

/** DELETE /api/modules/:id */
export async function DELETE(_req: Request, { params }: { params: { moduleId: string } }) {
    try {
        await prisma.module.delete({ where: { id: params.moduleId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete module:", error);
        return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
    }
}
