"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/store/editorStore";
import type { Module, ModuleType } from "@/lib/types";

interface ModuleExplorerProps {
    modules: Module[];
    onAddModule?: (type: ModuleType) => void;
}

const TextIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const VisualIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);

const CodeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

function getModuleIcon(type: ModuleType) {
    switch (type) {
        case "RICH_TEXT":
            return <TextIcon />;
        case "INTERACTIVE_VISUAL":
            return <VisualIcon />;
        case "CODE_EDITOR":
            return <CodeIcon />;
    }
}

function getModuleTypeColor(type: ModuleType): string {
    switch (type) {
        case "RICH_TEXT":
            return "#4ec9b0";
        case "INTERACTIVE_VISUAL":
            return "#c586c0";
        case "CODE_EDITOR":
            return "#569cd6";
    }
}

export function ModuleExplorer({ modules, onAddModule }: ModuleExplorerProps) {
    const { activeModuleId, setActiveModule } = useEditorStore();
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const sortedModules = [...modules].sort((a, b) => a.position - b.position);

    return (
        <div
            className="flex flex-col h-full overflow-hidden"
            style={{ backgroundColor: "#252526" }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{ borderBottom: "1px solid #3e3e42" }}
            >
                <div className="flex items-center gap-1">
                    <span
                        className="transition-transform"
                        style={{
                            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                            color: "#858585",
                        }}
                    >
                        <ChevronDownIcon />
                    </span>
                    <span
                        className="text-xs font-semibold tracking-widest uppercase"
                        style={{ color: "#bbbbbb", letterSpacing: "0.1em" }}
                    >
                        Modules
                    </span>
                </div>
                <span className="text-xs" style={{ color: "#858585" }}>
                    {modules.length}
                </span>
            </div>

            {/* Module list */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto">
                    {sortedModules.map((module) => {
                        const isActive = activeModuleId === module.id;
                        return (
                            <button
                                key={module.id}
                                onClick={() => setActiveModule(module.id)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors group"
                                style={{
                                    backgroundColor: isActive ? "#37373d" : "transparent",
                                    color: isActive ? "#cccccc" : "#cccccc",
                                    borderLeft: isActive
                                        ? "2px solid #007acc"
                                        : "2px solid transparent",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = "#2a2d2e";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }
                                }}
                            >
                                {/* Drag handle (visual only) */}
                                <span
                                    className="opacity-0 group-hover:opacity-100 cursor-grab"
                                    style={{ color: "#858585" }}
                                >
                                    ⠿
                                </span>

                                {/* Type icon */}
                                <span style={{ color: getModuleTypeColor(module.type) }}>
                                    {getModuleIcon(module.type)}
                                </span>

                                {/* Title */}
                                <span className="text-xs truncate flex-1">{module.title}</span>

                                {/* Position badge */}
                                <span
                                    className="text-xs shrink-0 opacity-50"
                                    style={{ color: "#858585" }}
                                >
                                    {module.position + 1}
                                </span>
                            </button>
                        );
                    })}

                    {modules.length === 0 && (
                        <div className="px-4 py-6 text-center">
                            <p className="text-xs" style={{ color: "#858585" }}>
                                No modules yet.
                            </p>
                            <p className="text-xs mt-1" style={{ color: "#858585" }}>
                                Add a module to get started.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Add module button */}
            <div
                className="relative shrink-0"
                style={{ borderTop: "1px solid #3e3e42" }}
            >
                <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs transition-colors"
                    style={{ color: "#858585" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#cccccc")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#858585")}
                >
                    <PlusIcon />
                    <span>Add Module</span>
                </button>

                {showAddMenu && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowAddMenu(false)}
                        />
                        {/* Menu */}
                        <div
                            className="absolute bottom-full left-0 right-0 z-20 rounded-t overflow-hidden shadow-lg"
                            style={{
                                backgroundColor: "#252526",
                                border: "1px solid #3e3e42",
                            }}
                        >
                            {(
                                [
                                    { type: "RICH_TEXT" as ModuleType, label: "📄 Rich Text", color: "#4ec9b0" },
                                    { type: "INTERACTIVE_VISUAL" as ModuleType, label: "📊 Visual Diagram", color: "#c586c0" },
                                    { type: "CODE_EDITOR" as ModuleType, label: "💻 Code Editor", color: "#569cd6" },
                                ] as const
                            ).map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => {
                                        onAddModule?.(item.type);
                                        setShowAddMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
                                    style={{ color: "#cccccc" }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.backgroundColor = "#2a2d2e")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.backgroundColor = "transparent")
                                    }
                                >
                                    <span style={{ color: item.color }}>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
