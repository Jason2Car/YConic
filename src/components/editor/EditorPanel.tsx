"use client";

import { useEditorStore } from "@/lib/store/editorStore";
import { ModuleTabs } from "./ModuleTabs";
import { RichTextModule } from "@/components/modules/RichTextModule";
import { CodeEditorModule } from "@/components/modules/CodeEditorModule";
import { VisualModule } from "@/components/modules/VisualModule";
import type { Module } from "@/lib/types";

interface EditorPanelProps {
    modules: Module[];
}

function EmptyState() {
    return (
        <div
            className="flex flex-col items-center justify-center h-full"
            style={{ backgroundColor: "#1e1e1e" }}
        >
            <div className="text-center">
                <div className="text-6xl mb-4 opacity-20">📄</div>
                <p className="text-sm mb-2" style={{ color: "#858585" }}>
                    No module selected
                </p>
                <p className="text-xs" style={{ color: "#555" }}>
                    Select a module from the explorer or open a tab to start editing
                </p>
            </div>
        </div>
    );
}

export function EditorPanel({ modules }: EditorPanelProps) {
    const { activeModuleId } = useEditorStore();

    const activeModule = modules.find((m) => m.id === activeModuleId);

    const renderModuleEditor = (module: Module) => {
        switch (module.type) {
            case "RICH_TEXT":
                return (
                    <RichTextModule
                        content={module.content as Parameters<typeof RichTextModule>[0]["content"]}
                    />
                );
            case "CODE_EDITOR":
                return (
                    <CodeEditorModule
                        content={module.content as Parameters<typeof CodeEditorModule>[0]["content"]}
                    />
                );
            case "INTERACTIVE_VISUAL":
                return (
                    <VisualModule
                        content={module.content as Parameters<typeof VisualModule>[0]["content"]}
                    />
                );
        }
    };

    return (
        <div
            className="flex flex-col h-full"
            style={{ backgroundColor: "#1e1e1e" }}
        >
            {/* Tab bar */}
            <ModuleTabs modules={modules} />

            {/* Editor content */}
            <div className="flex-1 min-h-0">
                {activeModule ? renderModuleEditor(activeModule) : <EmptyState />}
            </div>
        </div>
    );
}
