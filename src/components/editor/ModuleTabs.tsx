"use client";

import { useEditorStore } from "@/lib/store/editorStore";
import type { Module, ModuleType } from "@/lib/mock/project";

interface ModuleTabsProps {
    modules: Module[];
}

function getTypeIcon(type: ModuleType): string {
    switch (type) {
        case "RICH_TEXT":
            return "📄";
        case "INTERACTIVE_VISUAL":
            return "📊";
        case "CODE_EDITOR":
            return "💻";
    }
}

export function ModuleTabs({ modules }: ModuleTabsProps) {
    const { openTabIds, activeModuleId, setActiveModule, closeTab } =
        useEditorStore();

    const openModules = openTabIds
        .map((id) => modules.find((m) => m.id === id))
        .filter(Boolean) as Module[];

    if (openModules.length === 0) {
        return (
            <div
                className="flex items-center h-9 px-4 shrink-0"
                style={{
                    backgroundColor: "#2d2d30",
                    borderBottom: "1px solid #3e3e42",
                }}
            >
                <span className="text-xs" style={{ color: "#858585" }}>
                    No modules open
                </span>
            </div>
        );
    }

    return (
        <div
            className="flex items-end h-9 overflow-x-auto shrink-0"
            style={{
                backgroundColor: "#2d2d30",
                borderBottom: "1px solid #3e3e42",
            }}
        >
            {openModules.map((module) => {
                const isActive = activeModuleId === module.id;
                return (
                    <div
                        key={module.id}
                        className="relative flex items-center gap-1.5 px-3 h-full cursor-pointer group shrink-0 max-w-[200px]"
                        style={{
                            backgroundColor: isActive ? "#1e1e1e" : "#2d2d30",
                            borderRight: "1px solid #3e3e42",
                            borderBottom: isActive
                                ? "1px solid #1e1e1e"
                                : "1px solid transparent",
                        }}
                        onClick={() => setActiveModule(module.id)}
                    >
                        {/* Active tab top accent */}
                        {isActive && (
                            <div
                                className="absolute top-0 left-0 right-0 h-0.5"
                                style={{ backgroundColor: "#007acc" }}
                            />
                        )}

                        {/* Icon */}
                        <span className="text-xs shrink-0">
                            {getTypeIcon(module.type)}
                        </span>

                        {/* Title */}
                        <span
                            className="text-xs truncate"
                            style={{ color: isActive ? "#cccccc" : "#858585" }}
                        >
                            {module.title}
                        </span>

                        {/* Close button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeTab(module.id);
                            }}
                            className="shrink-0 w-4 h-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "#858585" }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#3e3e42";
                                e.currentTarget.style.color = "#cccccc";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "#858585";
                            }}
                            title="Close tab"
                        >
                            ×
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
