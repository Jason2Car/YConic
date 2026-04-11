"use client";

import { useEditorStore } from "@/lib/store/editorStore";
import type { Module } from "@/lib/types";

interface StatusBarProps {
    modules: Module[];
}

export function StatusBar({ modules }: StatusBarProps) {
    const { activeModuleId } = useEditorStore();

    const activeModule = modules.find((m) => m.id === activeModuleId);

    const getLanguageLabel = () => {
        if (!activeModule) return null;
        switch (activeModule.type) {
            case "RICH_TEXT":
                return "Rich Text";
            case "INTERACTIVE_VISUAL":
                return "Mermaid";
            case "CODE_EDITOR": {
                const lang = (activeModule.content as { language?: string }).language;
                if (lang === "typescript") return "TypeScript";
                if (lang === "javascript") return "JavaScript";
                if (lang === "python") return "Python";
                return "Code";
            }
        }
    };

    const languageLabel = getLanguageLabel();

    return (
        <div
            className="flex items-center justify-between px-3 h-6 shrink-0 text-xs"
            style={{ backgroundColor: "#007acc", color: "#ffffff" }}
        >
            {/* Left: Stage indicator */}
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                    <span>●</span>
                    <span>Edit Stage</span>
                </span>
                <span style={{ opacity: 0.7 }}>|</span>
                <span>
                    {modules.length} module{modules.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Center: Active module info */}
            {activeModule && (
                <div className="flex items-center gap-2" style={{ opacity: 0.9 }}>
                    <span>{activeModule.title}</span>
                </div>
            )}

            {/* Right: Language / type */}
            <div className="flex items-center gap-3">
                {languageLabel && (
                    <>
                        <span style={{ opacity: 0.7 }}>|</span>
                        <span>{languageLabel}</span>
                    </>
                )}
                <span style={{ opacity: 0.7 }}>|</span>
                <span>UTF-8</span>
                <span style={{ opacity: 0.7 }}>|</span>
                <span>LF</span>
            </div>
        </div>
    );
}
