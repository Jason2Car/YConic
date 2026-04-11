"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ProjectSummary {
    id: string;
    title: string;
    description: string;
    stage: string;
    published: boolean;
    slug: string | null;
    createdAt: string;
    updatedAt: string;
    modules: { id: string }[];
}

export default function DashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch("/api/projects");
            if (res.ok) {
                const data = await res.json();
                setProjects(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to fetch:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() }),
            });
            if (res.ok) {
                const project = await res.json();
                router.push(`/builder/${project.id}/intro`);
            }
        } catch (err) {
            console.error("Failed to create:", err);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/projects/${id}`, { method: "DELETE" });
            setProjects((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#1e1e1e" }}>
            <header style={{ backgroundColor: "#252526", borderBottom: "1px solid #3e3e42" }}>
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
                {loading ? (
                    <div className="text-center py-20">
                        <p className="text-sm" style={{ color: "#858585" }}>Loading projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4 opacity-20">📋</div>
                        <p className="text-sm mb-2" style={{ color: "#858585" }}>No projects yet</p>
                        <p className="text-xs mb-6" style={{ color: "#555" }}>Create your first onboarding project to get started</p>
                        <div className="flex items-center justify-center gap-3">
                            <button onClick={() => setShowCreate(true)}
                                className="px-4 py-2 rounded text-sm font-medium text-white"
                                style={{ backgroundColor: "#007acc" }}>
                                Create Project
                            </button>
                            <button onClick={() => router.push("/builder/proj_demo/intro")}
                                className="px-4 py-2 rounded text-sm font-medium"
                                style={{ color: "#cccccc", border: "1px solid #3e3e42" }}>
                                Try Demo
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map((p) => (
                            <div key={p.id} className="rounded-lg overflow-hidden"
                                style={{ backgroundColor: "#252526", border: "1px solid #3e3e42" }}>
                                <div className="p-4">
                                    <h3 className="text-sm font-medium truncate" style={{ color: "#cccccc" }}>{p.title}</h3>
                                    {p.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: "#858585" }}>{p.description}</p>}
                                    <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: "#555" }}>
                                        <span>{p.modules?.length ?? 0} modules</span>
                                        <span>·</span>
                                        <span>{p.stage}</span>
                                        <span>·</span>
                                        <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop: "1px solid #3e3e42" }}>
                                    <a href={`/builder/${p.id}/${p.stage === "edit" ? "edit" : "intro"}`}
                                        className="flex-1 text-center text-xs py-1.5 rounded font-medium text-white"
                                        style={{ backgroundColor: "#007acc" }}>
                                        {p.stage === "edit" ? "Edit" : "Continue Setup"}
                                    </a>
                                    <button onClick={() => handleDelete(p.id)}
                                        className="text-xs py-1.5 px-3 rounded"
                                        style={{ color: "#f48771", border: "1px solid #f4877144" }}>
                                        Delete
                                    </button>
                                </div>
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
                                style={{ backgroundColor: !newTitle.trim() || creating ? "#3e3e42" : "#007acc" }}>
                                {creating ? "Creating..." : "Create Project"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
