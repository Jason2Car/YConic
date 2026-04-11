"use client";

import { X } from "lucide-react";
import { useBuilderStore } from "@/lib/store";

const MODULE_TYPE_ICONS: Record<string, string> = {
  RICH_TEXT: "📝",
  INTERACTIVE_VISUAL: "◈",
  CODE_EDITOR: "{ }",
};

export function TabBar() {
  const { project, activeModuleId, setActiveModule } = useBuilderStore();

  if (!project) return null;

  const sorted = project.modules.slice().sort((a, b) => a.position - b.position);

  return (
    <div className="flex items-end bg-vsc-tab h-9 border-b border-vsc-border overflow-x-auto shrink-0">
      {sorted.map((mod) => {
        const isActive = mod.id === activeModuleId;
        return (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={`flex items-center gap-2 px-4 h-full text-sm border-r border-vsc-border shrink-0 transition-colors group ${
              isActive
                ? "bg-vsc-tab-active text-vsc-text border-t-2 border-t-vsc-accent"
                : "text-vsc-text-muted hover:text-vsc-text bg-vsc-tab"
            }`}
          >
            <span className="text-xs font-mono">{MODULE_TYPE_ICONS[mod.type] ?? "•"}</span>
            <span className="max-w-[120px] truncate">{mod.title}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                // Close tab — just deselect if it's the active one
                if (isActive) setActiveModule(null);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-vsc-red transition-opacity ml-1"
            >
              <X size={12} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
