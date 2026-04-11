"use client";

import { useProjectStore } from "@/lib/store/projectStore";
import { ProjectPage } from "@/components/preview/ProjectPage";

export default function PreviewPage() {
    const project = useProjectStore((s) => s.project);
    return <ProjectPage project={project} />;
}
