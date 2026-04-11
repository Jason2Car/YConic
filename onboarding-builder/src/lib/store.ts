import { create } from "zustand";
import type { ProposedChange } from "@/lib/ai/schemas";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BuilderState {
  sessionId: string | null;
  messages: Message[];
  pendingChange: ProposedChange | null;
  isSaving: boolean;
  saveError: string | null;

  setSessionId: (id: string) => void;
  addMessage: (msg: Message) => void;
  setPendingChange: (change: ProposedChange | null) => void;
  setIsSaving: (saving: boolean) => void;
  setSaveError: (error: string | null) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  sessionId: null,
  messages: [],
  pendingChange: null,
  isSaving: false,
  saveError: null,

  setSessionId: (id) => set({ sessionId: id }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setPendingChange: (change) => set({ pendingChange: change }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setSaveError: (error) => set({ saveError: error }),
  reset: () => set({ sessionId: null, messages: [], pendingChange: null, isSaving: false, saveError: null }),
}));
