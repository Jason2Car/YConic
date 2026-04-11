"use client";

import { Files, Search, GitBranch, Bug, Puzzle, Settings, ChevronLeft } from "lucide-react";
import { useBuilderStore } from "@/lib/store";
import { useRouter } from "next/navigation";

interface ActivityBarProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
}

const topItems = [
  { id: "explorer", icon: Files, label: "Explorer" },
  { id: "search", icon: Search, label: "Search" },
  { id: "git", icon: GitBranch, label: "Source Control" },
  { id: "debug", icon: Bug, label: "Run and Debug" },
  { id: "extensions", icon: Puzzle, label: "Extensions" },
];

export function ActivityBar({ activePanel, onPanelChange }: ActivityBarProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center w-12 bg-vsc-sidebar border-r border-vsc-border shrink-0 py-1">
      {/* Back to dashboard */}
      <button
        onClick={() => router.push("/dashboard")}
        className="w-10 h-10 flex items-center justify-center text-vsc-text-muted hover:text-vsc-text rounded mb-1"
        title="Back to Dashboard"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="w-8 border-b border-vsc-border mb-1" />

      {/* Top nav items */}
      <div className="flex flex-col gap-0.5 flex-1">
        {topItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onPanelChange(id)}
            title={label}
            className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
              activePanel === id
                ? "text-vsc-text border-l-2 border-vsc-accent"
                : "text-vsc-text-muted hover:text-vsc-text"
            }`}
          >
            <Icon size={22} />
          </button>
        ))}
      </div>

      {/* Bottom settings */}
      <button
        title="Settings"
        className="w-10 h-10 flex items-center justify-center text-vsc-text-muted hover:text-vsc-text rounded"
      >
        <Settings size={22} />
      </button>
    </div>
  );
}
