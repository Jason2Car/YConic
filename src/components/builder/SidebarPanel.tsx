"use client";

import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from "lucide-react";
import { useState } from "react";
import { useBuilderStore } from "@/lib/store";
import type { Module } from "@/lib/types";

const MODULE_TYPE_LABELS: Record<Module["type"], string> = {
  RICH_TEXT: "Rich Text",
  INTERACTIVE_VISUAL: "Visual",
  CODE_EDITOR: "Code",
};

const MODULE_TYPE_COLORS: Record<Module["type"], string> = {
  RICH_TEXT: "text-vsc-blue",
  INTERACTIVE_VISUAL: "text-vsc-green",
  CODE_EDITOR: "text-vsc-yellow",
};

const MODULE_TYPE_ICONS: Record<Module["type"], string> = {
  RICH_TEXT: "T",
  INTERACTIVE_VISUAL: "◈",
  CODE_EDITOR: "⌥",
};

export function SidebarPanel() {
  const { project, activeModuleId, setActiveModule, applyChange } = useBuilderStore();
  const [modulesOpen, setModulesOpen] = useState(true);

  if (!project) return null;

  const handleAddModule = (type: Module["type"]) => {
    applyChange({
      type: "add_module",
      description: `Add ${MODULE_TYPE_LABELS[type]} module`,
      payload: { type, title: `New ${MODULE_TYPE_LABELS[type]}` },
    });
  };

  const handleDeleteModule = (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    applyChange({
      type: "delete_module",
      description: "Delete module",
      payload: { id: moduleId },
    });
  };

  return (
    <div className="w-60 bg-vsc-sidebar border-r border-vsc-border flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-vsc-text-muted border-b border-vsc-border">
        Explorer
      </div>

      {/* Project name */}
      <div className="px-3 py-2 border-b border-vsc-border">
        <p className="text-xs text-vsc-text-muted uppercase tracking-wider mb-0.5">Project</p>
        <p className="text-sm text-vsc-text font-medium truncate">{project.title}</p>
      </div>

      {/* Modules tree */}
      <div className="flex-1 overflow-y-auto">
        {/* Section header */}
        <button
          onClick={() => setModulesOpen((v) => !v)}
          className="w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-vsc-text-muted hover:text-vsc-text"
        >
          {modulesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Modules
          <span className="ml-auto text-vsc-text-muted font-normal normal-case tracking-normal">
            {project.modules.length}
          </span>
        </button>

        {modulesOpen && (
          <div className="pb-2">
            {project.modules
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((mod) => (
                <div
                  key={mod.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveModule(mod.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveModule(mod.id); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm group transition-colors cursor-pointer ${
                    activeModuleId === mod.id
                      ? "bg-vsc-accent/20 text-vsc-text"
                      : "text-vsc-text-muted hover:bg-white/5 hover:text-vsc-text"
                  }`}
                >
                  <GripVertical size={12} className="text-vsc-text-muted opacity-0 group-hover:opacity-100 shrink-0" />
                  <span className={`text-xs font-mono shrink-0 ${MODULE_TYPE_COLORS[mod.type]}`}>
                    {MODULE_TYPE_ICONS[mod.type]}
                  </span>
                  <span className="truncate text-left flex-1">{mod.title}</span>
                  <button
                    onClick={(e) => handleDeleteModule(e, mod.id)}
                    className="opacity-0 group-hover:opacity-100 text-vsc-text-muted hover:text-vsc-red transition-opacity shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

            {/* Add module buttons */}
            <div className="px-3 pt-2 flex flex-col gap-1">
              {(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"] as Module["type"][]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => handleAddModule(type)}
                    className="flex items-center gap-1.5 text-xs text-vsc-text-muted hover:text-vsc-text py-0.5"
                  >
                    <Plus size={12} />
                    <span>{MODULE_TYPE_LABELS[type]}</span>
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stage indicator */}
      <div className="px-3 py-2 border-t border-vsc-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-vsc-green" />
          <span className="text-xs text-vsc-text-muted capitalize">Stage: {project.stage}</span>
        </div>
      </div>
    </div>
  );
}
