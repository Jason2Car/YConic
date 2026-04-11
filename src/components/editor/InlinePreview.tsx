"use client";

import { useProjectStore } from "@/lib/store/projectStore";
import { PreviewRichText } from "@/components/preview/PreviewRichText";
import { PreviewVisual } from "@/components/preview/PreviewVisual";
import { PreviewCode } from "@/components/preview/PreviewCode";
import type { Module, ModuleType } from "@/lib/mock/project";

function TypeBadge({ type }: { type: ModuleType }) {
    const cfg = {
        RICH_TEXT: { label: "📄 Reading", bg: "#1a3a2a", color: "#4ade80", border: "#166534" },
        INTERACTIVE_VISUAL: { label: "📊 Interactive", bg: "#2d1b4e", color: "#c084fc", border: "#581c87" },
        CODE_EDITOR: { label: "💻 Exercise", bg: "#172554", color: "#60a5fa", border: "#1e3a5f" },
    }[type];
    return (
        <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
        </span>
    );
}

function ModuleBlock({ module, index, total }: { module: Module; index: number; total: number }) {
    const renderContent = () => {
        switch (module.type) {
            case "RICH_TEXT":
                return (
                    <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-gray-200 prose-p:text-gray-400 prose-li:text-gray-400
            prose-strong:text-gray-300 prose-a:text-blue-400">
                        <div dangerouslySetInnerHTML={{ __html: (module.content as { html: string }).html }} />
                    </div>
                );
            case "INTERACTIVE_VISUAL":
                return <PreviewVisual content={module.content as Parameters<typeof PreviewVisual>[0]["content"]} />;
            case "CODE_EDITOR":
                return <PreviewCode content={module.content as Parameters<typeof PreviewCode>[0]["content"]} />;
        }
    };

    return (
        <div className="rounded-lg overflow-hidden mb-4" style={{ border: "1px solid #3e3e42" }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ backgroundColor: "#252526", borderBottom: "1px solid #3e3e42" }}>
                <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#3e3e42", color: "#858585" }}>
                    {index + 1}
                </span>
                <TypeBadge type={module.type} />
                <h3 className="text-sm font-medium flex-1 truncate" style={{ color: "#cccccc" }}>{module.title}</h3>
                <span className="text-xs" style={{ color: "#555" }}>{index + 1}/{total}</span>
            </div>
            {/* Content */}
            <div className="p-4" style={{ backgroundColor: "#1e1e1e" }}>
                {renderContent()}
            </div>
        </div>
    );
}

export function InlinePreview() {
    const project = useProjectStore((s) => s.project);
    const modules = [...project.modules].sort((a, b) => a.position - b.position);

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: "#1e1e1e" }}>
            {/* Preview header */}
            <div className="flex items-center gap-2 px-4 py-2 shrink-0"
                style={{ backgroundColor: "#2d2d30", borderBottom: "1px solid #3e3e42" }}>
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#bbbbbb" }}>
                    Live Preview
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#28a74533", color: "#4ade80", border: "1px solid #28a74555" }}>
                    {modules.length} modules
                </span>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4">
                {modules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-4xl mb-3 opacity-20">📋</div>
                        <p className="text-sm" style={{ color: "#858585" }}>No modules yet</p>
                        <p className="text-xs mt-1" style={{ color: "#555" }}>Use the AI chat to add modules</p>
                    </div>
                ) : (
                    <>
                        {/* Project hero */}
                        <div className="rounded-lg p-5 mb-4" style={{ background: "linear-gradient(135deg, #1a365d, #2d1b69)", border: "1px solid #3e3e42" }}>
                            <h1 className="text-xl font-bold mb-1" style={{ color: "#e2e8f0" }}>{project.title}</h1>
                            {project.description && <p className="text-sm" style={{ color: "#94a3b8" }}>{project.description}</p>}
                            <div className="flex gap-3 mt-3 text-xs" style={{ color: "#64748b" }}>
                                <span>{modules.filter(m => m.type === "RICH_TEXT").length} readings</span>
                                <span>·</span>
                                <span>{modules.filter(m => m.type === "INTERACTIVE_VISUAL").length} visuals</span>
                                <span>·</span>
                                <span>{modules.filter(m => m.type === "CODE_EDITOR").length} exercises</span>
                            </div>
                        </div>

                        {/* Module blocks */}
                        {modules.map((m, i) => (
                            <ModuleBlock key={m.id} module={m} index={i} total={modules.length} />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
