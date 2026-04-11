import { create } from "zustand";
import type { Module, ModuleContent, ModuleType, Project } from "@/lib/types";

interface ProjectStore {
    project: Project | null;
    loading: boolean;
    error: string | null;
    /** Hydrate the store from the database via API */
    loadProject: (projectId: string) => Promise<void>;
    /** Set project directly (for SSR or testing) */
    setProject: (project: Project) => void;
    addModule: (type: ModuleType, title: string, content: ModuleContent) => Promise<string | null>;
    updateModule: (id: string, updates: { title?: string; content?: ModuleContent }) => Promise<void>;
    deleteModule: (id: string) => Promise<void>;
    reorderModules: (orderedIds: string[]) => void;
    getModules: () => Module[];
    /** Persist project metadata to the database */
    saveProject: (updates: Partial<Pick<Project, "title" | "description" | "stage" | "published" | "slug">>) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
    project: null,
    loading: false,
    error: null,

    loadProject: async (projectId: string) => {
        set({ loading: true, error: null });
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            if (!res.ok) throw new Error(`Failed to load project: ${res.status}`);
            const project = await res.json();
            set({ project, loading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : "Failed to load project", loading: false });
        }
    },

    setProject: (project: Project) => {
        set({ project, loading: false, error: null });
    },

    addModule: async (type, title, content) => {
        const { project } = get();
        if (!project) return null;

        try {
            const res = await fetch(`/api/projects/${project.id}/modules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, title, content }),
            });
            if (!res.ok) throw new Error("Failed to add module");
            const newModule = await res.json();

            set({
                project: {
                    ...project,
                    modules: [...project.modules, newModule],
                    updatedAt: new Date().toISOString(),
                },
            });
            return newModule.id;
        } catch (err) {
            console.error("Failed to add module:", err);
            return null;
        }
    },

    updateModule: async (id, updates) => {
        const { project } = get();
        if (!project) return;

        // Optimistic update
        set({
            project: {
                ...project,
                modules: project.modules.map((m) =>
                    m.id === id
                        ? {
                            ...m,
                            ...(updates.title !== undefined ? { title: updates.title } : {}),
                            ...(updates.content !== undefined ? { content: updates.content } : {}),
                            updatedAt: new Date().toISOString(),
                        }
                        : m
                ),
                updatedAt: new Date().toISOString(),
            },
        });

        // Persist to database
        try {
            await fetch(`/api/modules/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
        } catch (err) {
            console.error("Failed to persist module update:", err);
        }
    },

    deleteModule: async (id) => {
        const { project } = get();
        if (!project) return;

        const filtered = project.modules
            .filter((m) => m.id !== id)
            .map((m, i) => ({ ...m, position: i }));

        set({
            project: {
                ...project,
                modules: filtered,
                updatedAt: new Date().toISOString(),
            },
        });

        try {
            await fetch(`/api/modules/${id}`, { method: "DELETE" });
        } catch (err) {
            console.error("Failed to persist module deletion:", err);
        }
    },

    reorderModules: (orderedIds) => {
        const { project } = get();
        if (!project) return;
        const moduleMap = new Map(project.modules.map((m) => [m.id, m]));
        const reordered = orderedIds
            .map((id, i) => {
                const mod = moduleMap.get(id);
                return mod ? { ...mod, position: i } : null;
            })
            .filter(Boolean) as Module[];

        set({
            project: {
                ...project,
                modules: reordered,
                updatedAt: new Date().toISOString(),
            },
        });
    },

    getModules: () => {
        const project = get().project;
        if (!project) return [];
        return [...project.modules].sort((a, b) => a.position - b.position);
    },

    saveProject: async (updates) => {
        const { project } = get();
        if (!project) return;

        try {
            const res = await fetch(`/api/projects/${project.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const updated = await res.json();
                set({ project: updated });
            }
        } catch (err) {
            console.error("Failed to save project:", err);
        }
    },
}));
