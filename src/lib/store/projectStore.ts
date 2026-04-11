import { create } from "zustand";
import type { Module, ModuleContent, ModuleType, Project } from "@/lib/mock/project";
import { MOCK_PROJECT } from "@/lib/mock/project";

interface ProjectStore {
    project: Project;
    // actions
    addModule: (type: ModuleType, title: string, content: ModuleContent) => string;
    updateModule: (id: string, updates: { title?: string; content?: ModuleContent }) => void;
    deleteModule: (id: string) => void;
    reorderModules: (orderedIds: string[]) => void;
    getModules: () => Module[];
}

let moduleCounter = 100;

export const useProjectStore = create<ProjectStore>((set, get) => ({
    project: { ...MOCK_PROJECT },

    addModule: (type, title, content) => {
        moduleCounter++;
        const newId = `module-${moduleCounter}`;
        const { project } = get();
        const maxPosition = project.modules.reduce((max, m) => Math.max(max, m.position), -1);

        const newModule: Module = {
            id: newId,
            projectId: project.id,
            type,
            title,
            position: maxPosition + 1,
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        set({
            project: {
                ...project,
                modules: [...project.modules, newModule],
                updatedAt: new Date().toISOString(),
            },
        });

        return newId;
    },

    updateModule: (id, updates) => {
        const { project } = get();
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
    },

    deleteModule: (id) => {
        const { project } = get();
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
    },

    reorderModules: (orderedIds) => {
        const { project } = get();
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
        return get().project.modules.sort((a, b) => a.position - b.position);
    },
}));
