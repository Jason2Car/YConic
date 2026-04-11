import { prisma } from "@/server/db/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
    try {
        const { type, title, content, position } = await req.json();
        let pos = position;
        if (pos === undefined || pos === null) {
            const last = await prisma.module.findFirst({
                where: { projectId: params.projectId },
                orderBy: { position: "desc" },
            });
            pos = last ? last.position + 1 : 0;
        }
        const mod = await prisma.module.create({
            data: { projectId: params.projectId, type, title: title || "Untitled", position: pos, content: content || {} },
        });
        return NextResponse.json(mod, { status: 201 });
    } catch (error) {
        console.error("Failed to create module:", error);
        return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
    }
}
