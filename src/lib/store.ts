"use client";

import { create } from "zustand";
import type { Project, Module, ChatMessage, RevisionEntry, ProposedChange, IntroFormData } from "./types";

interface BuilderState {
  project: Project | null;
  activeModuleId: string | null;
  messages: ChatMessage[];
  revisionHistory: RevisionEntry[];
  isSaving: boolean;
  saveError: boolean;
  isAiThinking: boolean;
  introData: IntroFormData | null;

  // Actions
  setProject: (project: Project) => void;
  setActiveModule: (id: string | null) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  applyChange: (change: ProposedChange) => void;
  undo: () => void;
  updateModuleContent: (moduleId: string, content: Module["content"]) => void;
  updateModuleTitle: (moduleId: string, title: string) => void;
  setSaving: (v: boolean) => void;
  setSaveError: (v: boolean) => void;
  setAiThinking: (v: boolean) => void;
  setIntroData: (data: IntroFormData) => void;
  advanceToEdit: () => void;
  autoSave: () => Promise<void>;
  saveToDb: () => Promise<void>;
  loadFromDb: (projectId: string) => Promise<boolean>;
}

/**
 * Zustand store for the builder workspace. Manages the current project,
 * chat messages, revision history, and auto-save state. The `applyChange`
 * action applies a ProposedChange to the project and triggers `autoSave`
 * to persist the update to the server with exponential backoff retry.
 */
export const useBuilderStore = create<BuilderState>((set, get) => ({
  project: null,
  activeModuleId: null,
  messages: [],
  revisionHistory: [],
  isSaving: false,
  saveError: false,
  isAiThinking: false,
  introData: null,

  setProject: (project) => set({ project }),

  setActiveModule: (id) => set({ activeModuleId: id }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  applyChange: (change) => {
    const { project, revisionHistory } = get();
    if (!project) return;

    // Push snapshot before change
    const entry: RevisionEntry = {
      timestamp: new Date().toISOString(),
      changeDescription: change.description,
      snapshotBefore: JSON.parse(JSON.stringify(project)),
    };

    let updated = { ...project };

    if (change.type === "add_module") {
      const payload = change.payload as Partial<Module>;
      const newModule: Module = {
        id: `mod_${Date.now()}`,
        projectId: project.id,
        type: payload.type ?? "RICH_TEXT",
        title: payload.title ?? "New Module",
        position: project.modules.length,
        content: payload.content ?? { type: "RICH_TEXT", html: "" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = { ...project, modules: [...project.modules, newModule] };
    } else if (change.type === "update_module") {
      const payload = change.payload as { id: string } & Partial<Module>;
      updated = {
        ...project,
        modules: project.modules.map((m) =>
          m.id === payload.id ? { ...m, ...payload } : m
        ),
      };
    } else if (change.type === "delete_module") {
      const payload = change.payload as { id: string };
      updated = {
        ...project,
        modules: project.modules
          .filter((m) => m.id !== payload.id)
          .map((m, i) => ({ ...m, position: i })),
      };
    } else if (change.type === "update_project_meta") {
      const payload = change.payload as Partial<Project>;
      updated = { ...project, ...payload };
    }

    set({
      project: updated,
      revisionHistory: [...revisionHistory, entry],
    });

    // Trigger auto-save after applying the change
    get().autoSave();
  },

  undo: () => {
    const { revisionHistory } = get();
    if (revisionHistory.length === 0) return;
    const last = revisionHistory[revisionHistory.length - 1];
    set({
      project: last.snapshotBefore,
      revisionHistory: revisionHistory.slice(0, -1),
    });
  },

  updateModuleContent: (moduleId, content) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        modules: project.modules.map((m) =>
          m.id === moduleId ? { ...m, content } : m
        ),
      },
    });
  },

  updateModuleTitle: (moduleId, title) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        modules: project.modules.map((m) =>
          m.id === moduleId ? { ...m, title } : m
        ),
      },
    });
  },

  setSaving: (v) => set({ isSaving: v }),
  setSaveError: (v) => set({ saveError: v }),
  setAiThinking: (v) => set({ isAiThinking: v }),

  setIntroData: (data) => set({ introData: data }),

  advanceToEdit: () => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, stage: "edit" } });
  },

  /**
   * Persists the current project state to the server via PUT /api/projects/[id].
   * On failure, retries with exponential backoff (1s, 2s, 4s) up to 3 times.
   * Sets isSaving/saveError flags so the UI can display save status.
   */
  autoSave: async () => {
    const { project } = get();
    if (!project) return;

    set({ isSaving: true, saveError: false });

    const delays = [1000, 2000, 4000];
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const res = await fetch(`/api/projects/${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: project.title,
            description: project.description,
          }),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        set({ isSaving: false, saveError: false });
        return;
      } catch (err) {
        lastError = err;
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
    }

    console.error("Auto-save failed after retries:", lastError);
    set({ isSaving: false, saveError: true });
  },

  saveToDb: async () => {
    const { project, introData } = get();
    if (!project) return;
    set({ isSaving: true, saveError: false });
    try {
      await fetch(`/api/projects/${project.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          stage: project.stage,
          introData: introData || null,
          modules: project.modules,
        }),
      });
      set({ isSaving: false });
    } catch (err) {
      console.error("Save failed:", err);
      set({ isSaving: false, saveError: true });
    }
  },

  loadFromDb: async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) return false;
      const data = await res.json();
      set({
        project: {
          id: data.id,
          title: data.title,
          description: data.description,
          slug: data.slug,
          published: data.published,
          stage: data.stage,
          ownerId: null,
          modules: data.modules || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        introData: data.introData || null,
      });
      return true;
    } catch {
      return false;
    }
  },
}));
