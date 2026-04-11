"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");

    const handleCreate = () => {
        if (!newTitle.trim()) return;
        // Generate a simple project ID and go to intro
        const id = `proj_${Date.now()}`;
        router.push(`/builder/${id}/intro`);
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
                            <button onClick={handleCreate} disabled={!newTitle.trim()}
                                className="px-4 py-2 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: !newTitle.trim() ? "#3e3e42" : "#007acc" }}>
                                Create Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
