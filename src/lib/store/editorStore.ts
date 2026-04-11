import { create } from "zustand";

export type SidebarView = "modules" | "search" | "settings";
export type SaveStatus = "saved" | "saving" | "error";

interface EditorStore {
    activeModuleId: string | null;
    openTabIds: string[];
    sidebarView: SidebarView;
    sidebarOpen: boolean;
    saveStatus: SaveStatus;
    // actions
    setActiveModule: (id: string) => void;
    openTab: (id: string) => void;
    closeTab: (id: string) => void;
    setSidebarView: (view: SidebarView) => void;
    toggleSidebar: () => void;
    setSaveStatus: (status: SaveStatus) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
    activeModuleId: null,
    openTabIds: [],
    sidebarView: "modules",
    sidebarOpen: true,
    saveStatus: "saved",

    setActiveModule: (id: string) => {
        const { openTabIds } = get();
        set({
            activeModuleId: id,
            openTabIds: openTabIds.includes(id) ? openTabIds : [...openTabIds, id],
        });
    },

    openTab: (id: string) => {
        const { openTabIds } = get();
        if (!openTabIds.includes(id)) {
            set({ openTabIds: [...openTabIds, id] });
        }
        set({ activeModuleId: id });
    },

    closeTab: (id: string) => {
        const { openTabIds, activeModuleId } = get();
        const newTabs = openTabIds.filter((tabId) => tabId !== id);
        let newActiveId = activeModuleId;

        if (activeModuleId === id) {
            const closedIndex = openTabIds.indexOf(id);
            if (newTabs.length > 0) {
                // Activate the tab to the left, or the first tab if closing the first
                newActiveId = newTabs[Math.max(0, closedIndex - 1)];
            } else {
                newActiveId = null;
            }
        }

        set({ openTabIds: newTabs, activeModuleId: newActiveId });
    },

    setSidebarView: (view: SidebarView) => {
        const { sidebarView, sidebarOpen } = get();
        if (sidebarView === view && sidebarOpen) {
            // Clicking the same icon collapses the sidebar
            set({ sidebarOpen: false });
        } else {
            set({ sidebarView: view, sidebarOpen: true });
        }
    },

    toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
    },

    setSaveStatus: (status: SaveStatus) => {
        set({ saveStatus: status });
    },
}));
