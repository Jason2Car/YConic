"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ProjectSummary {
    id: string;
    title: string;
    description: string;
    slug: string | null;
    published: boolean;
    stage: string;
    createdAt: string;
    updatedAt: string;
    modules: unknown[];
}

export default function DashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchProjects = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch("/api/projects");
            if (!res.ok) throw new Error("Failed to load projects");
            const data = await res.json();
            setProjects(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load projects");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleCreate = async () => {
        if (!newTitle.trim() || creating) return;
        setCreating(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() }),
            });
            if (!res.ok) throw new Error("Failed to create project");
            const project = await res.json();
            setShowCreate(false);
            setNewTitle("");
            setNewDesc("");
            router.push(`/builder/${project.id}/intro`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create project");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete project");
            setProjects((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete project");
        }
    };

    const handleDemo = () => {
        router.push("/builder/proj_demo/intro");
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#1e1e1e" }}>
            <header className="border-b" style={{ borderColor: "#3e3e42", backgroundColor: "#252526" }}>
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold" style={{ color: "#cccccc" }}>Onboarding Project Builder</h1>
                        <p className="text-xs mt-0.5" style={{ color: "#858585" }}>Create interactive onboarding experiences with AI</p>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                        className="px-4 py-2 rounded text-sm font-medium text-white"
                        style={{ backgroundColor: "#007acc" }}>
                        + New Project
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-4 px-4 py-2 rounded text-sm" style={{ backgroundColor: "#5a1d1d", color: "#f48771", border: "1px solid #6e2b2b" }}>
                        {error}
                        <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-3xl mb-4 animate-pulse opacity-30">⏳</div>
                        <p className="text-sm" style={{ color: "#858585" }}>Loading projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4 opacity-30">🚀</div>
                        <h2 className="text-xl font-semibold mb-2" style={{ color: "#cccccc" }}>Get Started</h2>
                        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "#858585" }}>
                            Create a new onboarding project or try the demo to see how it works.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => setShowCreate(true)}
                                className="px-6 py-3 rounded-lg text-sm font-medium text-white"
                                style={{ backgroundColor: "#007acc" }}>
                                Create New Project
                            </button>
                            <button onClick={handleDemo}
                                className="px-6 py-3 rounded-lg text-sm font-medium"
                                style={{ color: "#cccccc", border: "1px solid #3e3e42" }}>
                                Try Demo
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {projects.map((p) => (
                            <div key={p.id} className="rounded-lg p-4 flex items-center justify-between"
                                style={{ backgroundColor: "#252526", border: "1px solid #3e3e42" }}>
                                <div className="flex-1 min-w-0">
                                    <button
                                        onClick={() => router.push(`/builder/${p.id}/edit`)}
                                        className="text-sm font-medium hover:underline text-left"
                                        style={{ color: "#cccccc" }}
                                    >
                                        {p.title}
                                    </button>
                                    {p.description && (
                                        <p className="text-xs mt-0.5 truncate" style={{ color: "#858585" }}>{p.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "#3e3e42", color: "#858585" }}>
                                            {(p.modules as unknown[]).length} modules
                                        </span>
                                        {p.published && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "#28a74520", color: "#28a745" }}>
                                                Published
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="text-xs px-3 py-1 rounded ml-4"
                                    style={{ color: "#f48771", border: "1px solid #6e2b2b" }}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
                    <div className="rounded-lg p-6 w-full max-w-md" style={{ backgroundColor: "#252526", border: "1px solid #3e3e42" }}
                        onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-sm font-semibold mb-4" style={{ color: "#cccccc" }}>New Project</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs block mb-1" style={{ color: "#858585" }}>Title *</label>
                                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. Engineering Team Onboarding"
                                    className="w-full px-3 py-2 rounded text-sm outline-none"
                                    style={{ backgroundColor: "#3c3c3c", color: "#cccccc", border: "1px solid #3e3e42" }}
                                    autoFocus />
                            </div>
                            <div>
                                <label className="text-xs block mb-1" style={{ color: "#858585" }}>Description</label>
                                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Brief description" rows={3}
                                    className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
                                    style={{ backgroundColor: "#3c3c3c", color: "#cccccc", border: "1px solid #3e3e42" }} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded text-xs"
                                style={{ color: "#858585", border: "1px solid #3e3e42" }}>Cancel</button>
                            <button onClick={handleCreate} disabled={!newTitle.trim() || creating}
                                className="px-4 py-2 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: !newTitle.trim() ? "#3e3e42" : "#007acc" }}>
                                {creating ? "Creating..." : "Create Project"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
