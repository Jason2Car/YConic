"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBuilderStore } from "@/lib/store";
import { MOCK_PROJECT } from "@/lib/mockData";
import { sanitizeHtml } from "@/lib/sanitize";
import { VisualModule } from "@/components/modules/VisualModule";
import { CodeEditorModule } from "@/components/modules/CodeEditorModule";
import type { Module, ModuleType, RichTextContent, InteractiveVisualContent, CodeEditorContent } from "@/lib/types";

function TypeBadge({ type }: { type: ModuleType }) {
    const cfg = {
        RICH_TEXT: { label: "📄 Reading", bg: "#1a3a2a", color: "#4ade80", border: "#166534" },
        INTERACTIVE_VISUAL: { label: "📊 Interactive", bg: "#2d1b4e", color: "#c084fc", border: "#581c87" },
        CODE_EDITOR: { label: "💻 Exercise", bg: "#172554", color: "#60a5fa", border: "#1e3a5f" },
    }[type];
    return (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
        </span>
    );
}

function ModuleCard({ module, index, total, isComplete, onComplete, isActive }: {
    module: Module; index: number; total: number;
    isComplete: boolean; onComplete: () => void; isActive: boolean;
}) {
    const [expanded, setExpanded] = useState(true);

    const renderContent = () => {
        switch (module.type) {
            case "RICH_TEXT": {
                const html = (module.content as RichTextContent).html || "";
                return (
                    <div
                        className="prose prose-invert prose-sm max-w-none px-6 py-4
                            prose-headings:text-gray-200 prose-p:text-gray-400 prose-li:text-gray-400
                            prose-strong:text-gray-200 prose-a:text-blue-400 prose-code:text-emerald-400
                            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                            prose-blockquote:border-gray-600 prose-blockquote:text-gray-400
                            prose-hr:border-gray-700"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
                    />
                );
            }
            case "INTERACTIVE_VISUAL":
                return <VisualModule content={module.content as InteractiveVisualContent} readOnly />;
            case "CODE_EDITOR":
                return (
                    <div style={{ height: "400px" }}>
                        <CodeEditorModule content={module.content as CodeEditorContent} readOnly={false} />
                    </div>
                );
        }
    };

    return (
        <div id={`module-${module.id}`} className="rounded-xl overflow-hidden transition-all duration-300"
            style={{
                backgroundColor: "#1e1e1e",
                border: isActive ? "2px solid #007acc" : "1px solid #3e3e42",
                boxShadow: isActive ? "0 0 20px rgba(0,122,204,0.15)" : "none",
            }}>
            <button onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
                style={{ backgroundColor: "#252526" }}>
                <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: isComplete ? "#166534" : "#3e3e42", color: isComplete ? "#4ade80" : "#858585" }}>
                    {isComplete ? "✓" : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <TypeBadge type={module.type} />
                        <span className="text-xs" style={{ color: "#555" }}>{index + 1} of {total}</span>
                    </div>
                    <h3 className="text-base font-semibold truncate" style={{ color: "#cccccc" }}>{module.title}</h3>
                </div>
                <span style={{ color: "#555", transform: expanded ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▼</span>
            </button>

            {expanded && (
                <div className="px-5 pb-5">
                    <div className="pt-4" style={{ borderTop: "1px solid #3e3e42" }}>{renderContent()}</div>
                    <div className="flex items-center justify-between mt-5 pt-3" style={{ borderTop: "1px solid #3e3e42" }}>
                        <div>{isComplete && <span className="text-sm font-medium" style={{ color: "#4ade80" }}>✓ Completed</span>}</div>
                        {!isComplete && (
                            <button onClick={(e) => { e.stopPropagation(); onComplete(); }}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
                                style={{ backgroundColor: "#007acc", color: "#fff" }}>
                                Mark as Complete →
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PreviewPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.projectId as string;
    const { project, setProject } = useBuilderStore();
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

    useEffect(() => {
        if (!project || project.id !== projectId) {
            setProject({ ...MOCK_PROJECT, id: projectId });
        }
    }, [projectId, project, setProject]);

    const modules = project ? [...project.modules].sort((a, b) => a.position - b.position) : [];
    const progress = modules.length > 0 ? Math.round((completedIds.size / modules.length) * 100) : 0;
    const allComplete = modules.length > 0 && completedIds.size === modules.length;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => { for (const e of entries) if (e.isIntersecting) setActiveModuleId(e.target.id.replace("module-", "")); },
            { threshold: 0.3, rootMargin: "-80px 0px -40% 0px" }
        );
        modules.forEach((m) => { const el = document.getElementById(`module-${m.id}`); if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, [modules]);

    const handleComplete = (id: string) => {
        setCompletedIds((prev) => new Set([...prev, id]));
        const idx = modules.findIndex((m) => m.id === id);
        const next = modules.slice(idx + 1).find((m) => !completedIds.has(m.id));
        if (next) setTimeout(() => document.getElementById(`module-${next.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    };

    if (!project) {
        return <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#181818", color: "#858585" }}>Loading...</div>;
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#181818" }}>
            {/* Header */}
            <header className="sticky top-0 z-50" style={{ backgroundColor: "#1e1e1eee", borderBottom: "1px solid #3e3e42", backdropFilter: "blur(8px)" }}>
                <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push(`/builder/${projectId}/edit`)}
                            className="text-sm transition-colors" style={{ color: "#858585" }}>← Editor</button>
                        <span className="w-px h-4" style={{ backgroundColor: "#3e3e42" }} />
                        <span className="text-sm font-medium truncate max-w-[300px]" style={{ color: "#cccccc" }}>{project.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: "#858585" }}>{completedIds.size}/{modules.length}</span>
                        <div className="w-36 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#3e3e42" }}>
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${progress}%`, backgroundColor: allComplete ? "#4ade80" : "#007acc" }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: allComplete ? "#4ade80" : "#007acc" }}>{progress}%</span>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto flex gap-8 px-6 py-8">
                {/* Sidebar */}
                <nav className="hidden lg:block w-56 shrink-0">
                    <div className="sticky top-20">
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#555" }}>Contents</h3>
                        <ul className="space-y-0.5">
                            {modules.map((m, i) => {
                                const done = completedIds.has(m.id);
                                const active = activeModuleId === m.id;
                                return (
                                    <li key={m.id}>
                                        <button onClick={() => document.getElementById(`module-${m.id}`)?.scrollIntoView({ behavior: "smooth" })}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all"
                                            style={{ backgroundColor: active ? "#007acc22" : "transparent", color: done ? "#4ade80" : active ? "#007acc" : "#858585", fontWeight: active ? 600 : 400 }}>
                                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
                                                style={{ backgroundColor: done ? "#16653433" : active ? "#007acc33" : "#3e3e42", color: done ? "#4ade80" : active ? "#007acc" : "#858585" }}>
                                                {done ? "✓" : i + 1}
                                            </span>
                                            <span className="truncate">{m.title}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </nav>

                {/* Main */}
                <main className="flex-1 min-w-0 space-y-5">
                    <div className="rounded-xl p-6" style={{ background: "linear-gradient(135deg, #1a365d, #2d1b69)", border: "1px solid #3e3e42" }}>
                        <h1 className="text-2xl font-bold mb-1" style={{ color: "#e2e8f0" }}>{project.title}</h1>
                        {project.description && <p className="text-sm mb-3" style={{ color: "#94a3b8" }}>{project.description}</p>}
                        <div className="flex gap-3 text-xs" style={{ color: "#64748b" }}>
                            <span>{modules.length} modules</span>
                            <span>·</span>
                            <span>{modules.filter(m => m.type === "RICH_TEXT").length} readings</span>
                            <span>·</span>
                            <span>{modules.filter(m => m.type === "INTERACTIVE_VISUAL").length} visuals</span>
                            <span>·</span>
                            <span>{modules.filter(m => m.type === "CODE_EDITOR").length} exercises</span>
                        </div>
                    </div>

                    {modules.map((m, i) => (
                        <ModuleCard key={m.id} module={m} index={i} total={modules.length}
                            isComplete={completedIds.has(m.id)} onComplete={() => handleComplete(m.id)}
                            isActive={activeModuleId === m.id} />
                    ))}

                    {allComplete && (
                        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "#16653422", border: "2px solid #166534" }}>
                            <div className="text-4xl mb-3">🎉</div>
                            <h2 className="text-xl font-bold mb-1" style={{ color: "#4ade80" }}>Onboarding Complete!</h2>
                            <p style={{ color: "#22c55e" }}>All {modules.length} modules finished. Welcome to the team!</p>
                        </div>
                    )}

                    {modules.length === 0 && (
                        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: "#1e1e1e", border: "1px solid #3e3e42" }}>
                            <div className="text-4xl mb-3 opacity-20">📋</div>
                            <p style={{ color: "#858585" }}>No modules yet. Head back to the editor to add some.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
