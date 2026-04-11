import { prisma } from "@/server/db/prisma";
import { notFound } from "next/navigation";
import { JoineeView } from "./JoineeView";
import type { Metadata } from "next";

interface PageProps {
    params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const project = await prisma.project.findUnique({
        where: { slug: params.slug },
        select: { title: true, description: true },
    });
    return {
        title: project ? `${project.title} — Onboarding` : "Not Found",
        description: project?.description || undefined,
    };
}

export default async function PublicProjectPage({ params }: PageProps) {
    const project = await prisma.project.findUnique({
        where: { slug: params.slug },
        include: { modules: { orderBy: { position: "asc" } } },
    });

    if (!project || !project.published) {
        notFound();
    }

    // Serialize dates for client component
    const serialized = {
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        modules: project.modules.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
            updatedAt: m.updatedAt.toISOString(),
        })),
    };

    return <JoineeView project={serialized as any} />;
}
