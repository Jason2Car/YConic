"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/store/editorStore";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/mock/project";

interface TitleBarProps {
    project: Project;
}

export function TitleBar({ project }: TitleBarProps) {
    const { saveStatus } = useEditorStore();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(project.title);

    const saveStatusConfig = {
        saved: { color: "bg-green-500", label: "Saved" },
        saving: { color: "bg-yellow-500 animate-pulse", label: "Saving..." },
        error: { color: "bg-red-500", label: "Save error" },
    };

    const statusConfig = saveStatusConfig[saveStatus];

    return (
        <div
            className="flex items-center justify-between px-4 h-9 shrink-0"
            style={{ backgroundColor: "#323233", borderBottom: "1px solid #3e3e42" }}
        >
            {/* Left: App name */}
            <div className="flex items-center gap-2 text-xs text-[#858585]">
                <span className="font-medium text-[#cccccc]">Onboarding Builder</span>
                <span>/</span>
            </div>

            {/* Center: Project title */}
            <div className="flex items-center gap-2">
                {isEditingTitle ? (
                    <input
                        autoFocus
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") {
                                setIsEditingTitle(false);
                            }
                        }}
                        className="bg-[#3c3c3c] border border-[#007acc] rounded px-2 py-0.5 text-sm text-[#cccccc] outline-none min-w-[200px] text-center"
                    />
                ) : (
                    <button
                        onClick={() => setIsEditingTitle(true)}
                        className="text-sm font-medium text-[#cccccc] hover:text-white px-2 py-0.5 rounded hover:bg-[#2a2d2e] transition-colors"
                        title="Click to edit project title"
                    >
                        {title}
                    </button>
                )}

                {/* Save status indicator */}
                <div className="flex items-center gap-1.5" title={statusConfig.label}>
                    <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                    <span className="text-xs text-[#858585]">{statusConfig.label}</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => window.open(`/builder/${project.id}/preview`, '_blank')}
                    className="text-xs px-3 py-1 rounded text-[#cccccc] hover:bg-[#2a2d2e] transition-colors border border-[#3e3e42]"
                    title="Preview published view"
                >
                    Preview
                </button>
                <button
                    className="text-xs px-3 py-1 rounded font-medium text-white transition-colors"
                    style={{ backgroundColor: "#007acc" }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#1a8ad4")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#007acc")
                    }
                    title="Publish project"
                >
                    Publish
                </button>
            </div>
        </div>
    );
}
