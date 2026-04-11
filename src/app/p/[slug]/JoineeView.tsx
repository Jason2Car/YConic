"use client";

import { useState, useEffect } from "react";
import type { Project, Module, ModuleType } from "@/lib/types";
import { getProgress, markComplete } from "@/lib/progress";
import { PreviewRichText } from "@/components/preview/PreviewRichText";
import { PreviewVisual } from "@/components/preview/PreviewVisual";
import { PreviewCode } from "@/components/preview/PreviewCode";

function ModuleTypeTag({ type }: { type: ModuleType }) {
    const config = {
        RICH_TEXT: { label: "📄 Reading", bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
        INTERACTIVE_VISUAL: { label: "📊 Interactive", bg: "#faf5ff", color: "#9333ea", border: "#d8b4fe" },
        CODE_EDITOR: { label: "💻 Exercise", bg: "#eff6ff", color: "#2563eb", border: "#93c5fd" },
    }[type];
    return (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
            {config.label}
        </span>
    );
}

function ModuleCard({ module, index, total, isComplete, onComplete }: {
    module: Module; index: number; total: number; isComplete: boolean; onComplete: () => void;
}) {
    const [expanded, setExpanded] = useState(true);

    const renderContent = () => {
        switch (module.type) {
            case "RICH_TEXT":
                return <PreviewRichText content={module.content as any} />;
            case "INTERACTIVE_VISUAL":
                return <PreviewVisual content={module.content as any} />;
            case "CODE_EDITOR":
                return <PreviewCode content={module.content as any} />;
        }
    };

    return (
        <div id={`module-${module.id}`}
            className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <button onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: isComplete ? "#059669" : "#f3f4f6", color: isComplete ? "#fff" : "#6b7280" }}>
                    {isComplete ? "✓" : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <ModuleTypeTag type={module.type} />
                        <span className="text-xs text-gray-400">{index + 1} of {total}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{module.title}</h3>
                </div>
                <span className="text-gray-400 transition-transform duration-200"
                    style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}>▼</span>
            </button>
            {expanded && (
                <div className="px-6 pb-6">
                    <div className="border-t border-gray-100 pt-5">{renderContent()}</div>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                        <div>{isComplete && <span className="text-sm text-green-600 font-medium">✓ Completed</span>}</div>
                        {!isComplete && (
                            <button onClick={(e) => { e.stopPropagation(); onComplete(); }}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:shadow-md active:scale-95"
                                style={{ backgroundColor: "#3b82f6" }}>
                                Mark as Complete →
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function JoineeView({ project }: { project: Project }) {
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const modules = [...project.modules].sort((a, b) => a.position - b.position);
    const progress = modules.length > 0 ? Math.round((completedIds.size / modules.length) * 100) : 0;
    const allComplete = modules.length > 0 && completedIds.size === modules.length;

    // Load progress from localStorage on mount
    useEffect(() => {
        if (project.slug) {
            const saved = getProgress(project.slug);
            setCompletedIds(new Set(saved.completedModuleIds));
        }
    }, [project.slug]);

    const handleComplete = (moduleId: string) => {
        if (project.slug) {
            markComplete(project.slug, moduleId);
        }
        setCompletedIds((prev) => {
            const next = new Set(prev);
            next.add(moduleId);
            return next;
        });
    };

    const scrollToModule = (id: string) => {
        document.getElementById(`module-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
            {/* Sticky header with progress */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90" style={{ borderBottom: "1px solid #e5e7eb" }}>
                <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
                    <h1 className="text-sm font-semibold text-gray-800 truncate max-w-[300px]">{project.title}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{completedIds.size}/{modules.length}</span>
                        <div className="w-40 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#e5e7eb" }}
                            role="progressbar" aria-valuenow={completedIds.size} aria-valuemin={0} aria-valuemax={modules.length}
                            aria-label={`${completedIds.size} of ${modules.length} modules complete`}>
                            <div className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progress}%`, backgroundColor: allComplete ? "#059669" : "#3b82f6" }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: allComplete ? "#059669" : "#3b82f6" }}>
                            {progress}%
                        </span>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto flex gap-8 px-6 py-8">
                {/* Sidebar TOC */}
                <nav className="hidden lg:block w-60 shrink-0" aria-label="Module navigation">
                    <div className="sticky top-20">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contents</h3>
                        <ul className="space-y-0.5">
                            {modules.map((m, i) => {
                                const done = completedIds.has(m.id);
                                return (
                                    <li key={m.id}>
                                        <button onClick={() => scrollToModule(m.id)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left"
                                            style={{ color: done ? "#059669" : "#6b7280" }}>
                                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                                                style={{ backgroundColor: done ? "#dcfce7" : "#f3f4f6", color: done ? "#059669" : "#9ca3af", fontWeight: 600 }}>
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

                {/* Main content */}
                <main className="flex-1 min-w-0 space-y-6">
                    {/* Hero */}
                    <div className="rounded-2xl p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                        <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                        {project.description && <p className="text-blue-100 text-lg mb-4">{project.description}</p>}
                        <div className="flex items-center gap-4 text-sm text-blue-200">
                            <span>{modules.length} modules</span>
                            <span>·</span>
                            <span>{modules.filter((m) => m.type === "RICH_TEXT").length} readings</span>
                            <span>·</span>
                            <span>{modules.filter((m) => m.type === "INTERACTIVE_VISUAL").length} visuals</span>
                            <span>·</span>
                            <span>{modules.filter((m) => m.type === "CODE_EDITOR").length} exercises</span>
                        </div>
                    </div>

                    {modules.map((module, i) => (
                        <ModuleCard key={module.id} module={module} index={i} total={modules.length}
                            isComplete={completedIds.has(module.id)} onComplete={() => handleComplete(module.id)} />
                    ))}

                    {allComplete && (
                        <div className="rounded-2xl p-10 text-center bg-gradient-to-br from-green-50 to-emerald-50"
                            style={{ border: "2px solid #a7f3d0" }}>
                            <div className="text-5xl mb-4">🎉</div>
                            <h2 className="text-2xl font-bold text-green-800 mb-2">Onboarding Complete!</h2>
                            <p className="text-green-600 text-lg">You&apos;ve finished all {modules.length} modules.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
