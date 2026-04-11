"use client";

import { useEditorStore, type SidebarView } from "@/lib/store/editorStore";

interface ActivityItem {
    id: SidebarView;
    icon: React.ReactNode;
    label: string;
}

const FileIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
    </svg>
);

const SearchIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const SettingsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const ACTIVITY_ITEMS: ActivityItem[] = [
    { id: "modules", icon: <FileIcon />, label: "Modules (Explorer)" },
    { id: "search", icon: <SearchIcon />, label: "Search" },
    { id: "settings", icon: <SettingsIcon />, label: "Settings" },
];

export function ActivityBar() {
    const { sidebarView, sidebarOpen, setSidebarView } = useEditorStore();

    return (
        <div
            className="flex flex-col items-center py-2 w-12 shrink-0"
            style={{
                backgroundColor: "#333333",
                borderRight: "1px solid #3e3e42",
            }}
        >
            {ACTIVITY_ITEMS.map((item) => {
                const isActive = sidebarView === item.id && sidebarOpen;
                return (
                    <button
                        key={item.id}
                        onClick={() => setSidebarView(item.id)}
                        title={item.label}
                        aria-label={item.label}
                        className="relative flex items-center justify-center w-12 h-12 transition-colors"
                        style={{
                            color: isActive ? "#cccccc" : "#858585",
                            borderLeft: isActive
                                ? "2px solid #007acc"
                                : "2px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.color = "#cccccc";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.color = "#858585";
                            }
                        }}
                    >
                        {item.icon}
                    </button>
                );
            })}
        </div>
    );
}
