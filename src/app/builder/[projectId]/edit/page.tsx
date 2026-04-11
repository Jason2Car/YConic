"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ActivityBar } from "@/components/builder/ActivityBar";
import { SidebarPanel } from "@/components/builder/SidebarPanel";
import { EditorPanel } from "@/components/builder/EditorPanel";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { StatusBar } from "@/components/builder/StatusBar";
import { useBuilderStore } from "@/lib/store";
import { MOCK_PROJECT } from "@/lib/mockData";

export default function EditPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { setProject, project } = useBuilderStore();
  const [activePanel, setActivePanel] = useState("explorer");
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    // In production: fetch from tRPC — trpc.project.getById.useQuery({ id: projectId })
    // For now, load mock data
    setProject({ ...MOCK_PROJECT, id: projectId ?? MOCK_PROJECT.id });
  }, [projectId, setProject]);

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
      <div className="h-screen bg-vsc-bg flex items-center justify-center text-vsc-text-muted text-sm">
        Loading project...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-vsc-bg overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center h-8 bg-bg-surface border-b border-border px-4 shrink-0">
        <div className="flex-1 text-center text-xs text-text-secondary font-sans">
          {project.title} — Onboarding Project Builder
        </div>
        {/* macOS-style window controls (decorative) */}
        <div className="absolute left-4 flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Activity bar */}
        <ActivityBar activePanel={activePanel} onPanelChange={handlePanelChange} />

        {/* Sidebar */}
        {sidebarVisible && activePanel === "explorer" && <SidebarPanel />}

        {/* Center editor */}
        <EditorPanel />

        {/* AI Chat panel */}
        <ChatPanel />
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
