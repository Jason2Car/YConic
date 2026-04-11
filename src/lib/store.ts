"use client";

import { create } from "zustand";
import type { Project, Module, ChatMessage, RevisionEntry, ProposedChange } from "./types";

interface BuilderState {
  project: Project | null;
  activeModuleId: string | null;
  messages: ChatMessage[];
  revisionHistory: RevisionEntry[];
  isSaving: boolean;
  saveError: boolean;
  isAiThinking: boolean;

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
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  project: null,
  activeModuleId: null,
  messages: [],
  revisionHistory: [],
  isSaving: false,
  saveError: false,
  isAiThinking: false,

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
        content: payload.content ?? null,
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
}));
