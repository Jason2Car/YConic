"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProjectPage } from "@/components/preview/ProjectPage";
import type { Project } from "@/lib/types";

export default function PreviewPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [project, setProject] = useState<Project | null>(null);

    useEffect(() => {
        fetch(`/api/projects/${projectId}`)
            .then((res) => res.json())
            .then(setProject)
            .catch(console.error);
    }, [projectId]);

    if (!project) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <p className="text-gray-400">Loading preview...</p>
            </div>
        );
    }

    return <ProjectPage project={project} />;
}
