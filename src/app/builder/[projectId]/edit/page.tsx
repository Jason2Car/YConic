"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ActivityBar } from "@/components/builder/ActivityBar";
import { SidebarPanel } from "@/components/builder/SidebarPanel";
import { EditorPanel } from "@/components/builder/EditorPanel";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { StatusBar } from "@/components/builder/StatusBar";
import { useBuilderStore } from "@/lib/store";
import { MOCK_PROJECT } from "@/lib/mockData";

export default function EditPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.projectId as string;
    const { setProject, project } = useBuilderStore();
    const [activePanel, setActivePanel] = useState("explorer");
    const [sidebarVisible, setSidebarVisible] = useState(true);

    useEffect(() => {
        if (!project || project.id !== projectId) {
            setProject({ ...MOCK_PROJECT, id: projectId ?? MOCK_PROJECT.id });
        }
    }, [projectId, project, setProject]);

    useEffect(() => {
        if (project && project.stage !== "edit") {
            router.replace(`/builder/${projectId}/intro`);
        }
    }, [project, projectId, router]);

    const handlePanelChange = (panel: string) => {
        if (panel === activePanel) {
            setSidebarVisible((v) => !v);
        } else {
            setActivePanel(panel);
            setSidebarVisible(true);
        }
    };

    if (!project) {
        return (
            <div className="h-screen bg-bg-primary flex items-center justify-center text-text-secondary text-sm">
                Loading project...
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center h-8 bg-bg-surface border-b border-border px-4 shrink-0 relative">
                <div className="absolute left-4 flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 text-center text-xs text-text-secondary">
                    {project.title} — Onboarding Project Builder
                </div>
                <div className="absolute right-4 flex items-center gap-2">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-xs px-2 py-0.5 rounded transition-colors"
                        style={{ color: "#858585", border: "1px solid #3e3e42" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#cccccc")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#858585")}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => router.push(`/builder/${projectId}/preview`)}
                        className="text-xs px-3 py-0.5 rounded font-medium transition-colors"
                        style={{ backgroundColor: "#007acc", color: "#fff" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a8ad4")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#007acc")}
                    >
                        ▶ Preview
                    </button>
                </div>
            </div>

            {/* Main layout */}
            <div className="flex flex-1 min-h-0">
                <ActivityBar activePanel={activePanel} onPanelChange={handlePanelChange} />
                {sidebarVisible && activePanel === "explorer" && <SidebarPanel />}
                <EditorPanel />
                <ChatPanel />
            </div>

            <StatusBar />
        </div>
    );
}
