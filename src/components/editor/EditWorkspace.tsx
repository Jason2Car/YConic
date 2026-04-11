"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { TitleBar } from "./TitleBar";
import { ActivityBar } from "./ActivityBar";
import { ModuleExplorer } from "./ModuleExplorer";
import { EditorPanel } from "./EditorPanel";
import { ChatPanel } from "./ChatPanel";
import { StatusBar } from "./StatusBar";
import { useEditorStore } from "@/lib/store/editorStore";
import { useProjectStore } from "@/lib/store/projectStore";

export function EditWorkspace() {
    const { sidebarOpen, sidebarView } = useEditorStore();
    const project = useProjectStore((s) => s.project);

    return (
        <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "#1e1e1e" }}>
            <TitleBar project={project} />

            <div className="flex flex-1 min-h-0">
                <ActivityBar />

                {sidebarOpen && sidebarView === "modules" && (
                    <div
                        className="w-56 shrink-0 flex flex-col"
                        style={{ backgroundColor: "#252526", borderRight: "1px solid #3e3e42" }}
                    >
                        <ModuleExplorer modules={project.modules} />
                    </div>
                )}

                {sidebarOpen && sidebarView === "search" && (
                    <div
                        className="w-56 shrink-0 flex flex-col"
                        style={{ backgroundColor: "#252526", borderRight: "1px solid #3e3e42" }}
                    >
                        <SearchPanel />
                    </div>
                )}

                {sidebarOpen && sidebarView === "settings" && (
                    <div
                        className="w-56 shrink-0 flex flex-col"
                        style={{ backgroundColor: "#252526", borderRight: "1px solid #3e3e42" }}
                    >
                        <SettingsPanel />
                    </div>
                )}

                <PanelGroup direction="horizontal" className="flex-1 min-w-0">
                    <Panel defaultSize={65} minSize={30}>
                        <EditorPanel modules={project.modules} />
                    </Panel>
                    <PanelResizeHandle className="w-1 transition-colors" style={{ backgroundColor: "#3e3e42" }} />
                    <Panel defaultSize={35} minSize={20} maxSize={50}>
                        <ChatPanel />
                    </Panel>
                </PanelGroup>
            </div>

            <StatusBar modules={project.modules} />
        </div>
    );
}

function SearchPanel() {
    return (
        <div className="flex flex-col h-full p-3">
            <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#bbbbbb", letterSpacing: "0.1em" }}>
                Search
            </div>
            <input
                type="text"
                placeholder="Search modules..."
                className="w-full px-2 py-1.5 rounded text-xs outline-none"
                style={{ backgroundColor: "#3c3c3c", color: "#cccccc", border: "1px solid #3e3e42" }}
            />
            <p className="text-xs mt-4 text-center" style={{ color: "#555" }}>
                Search functionality coming soon
            </p>
        </div>
    );
}

function SettingsPanel() {
    return (
        <div className="flex flex-col h-full p-3">
            <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#bbbbbb", letterSpacing: "0.1em" }}>
                Settings
            </div>
            <div className="space-y-3">
                <div>
                    <label className="text-xs block mb-1" style={{ color: "#858585" }}>Auto-save</label>
                    <select
                        className="w-full px-2 py-1 rounded text-xs outline-none"
                        style={{ backgroundColor: "#3c3c3c", color: "#cccccc", border: "1px solid #3e3e42" }}
                    >
                        <option>Every 5 seconds</option>
                        <option>Every 30 seconds</option>
                        <option>Manual only</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs block mb-1" style={{ color: "#858585" }}>Editor font size</label>
                    <select
                        className="w-full px-2 py-1 rounded text-xs outline-none"
                        style={{ backgroundColor: "#3c3c3c", color: "#cccccc", border: "1px solid #3e3e42" }}
                    >
                        <option>12px</option>
                        <option>13px</option>
                        <option>14px</option>
                        <option>16px</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
