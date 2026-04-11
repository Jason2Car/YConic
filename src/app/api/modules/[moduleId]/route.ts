import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";

// PUT /api/modules/:id — update a module
export async function PUT(req: Request, { params }: { params: { moduleId: string } }) {
    try {
        const data = await req.json();
        const mod = await prisma.module.update({
            where: { id: params.moduleId },
            data: {
                title: data.title,
                content: data.content,
                type: data.type,
                position: data.position,
            },
        });
        return NextResponse.json(mod);
    } catch (error) {
        console.error("Failed to update module:", error);
        return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
    }
}

// DELETE /api/modules/:id
export async function DELETE(_req: Request, { params }: { params: { moduleId: string } }) {
    try {
        await prisma.module.delete({ where: { id: params.moduleId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete module:", error);
        return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
    }
}
