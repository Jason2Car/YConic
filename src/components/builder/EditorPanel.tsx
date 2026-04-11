"use client";

import { useBuilderStore } from "@/lib/store";
import { RichTextModule } from "@/components/modules/RichTextModule";
import { VisualModule } from "@/components/modules/VisualModule";
import { CodeEditorModule } from "@/components/modules/CodeEditorModule";
import { TabBar } from "./TabBar";
import { FileCode2 } from "lucide-react";
import type { RichTextContent, InteractiveVisualContent, CodeEditorContent } from "@/lib/types";

export function EditorPanel() {
  const { project, activeModuleId, updateModuleTitle } = useBuilderStore();

  const activeModule = project?.modules.find((m) => m.id === activeModuleId);

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-vsc-panel">
      <TabBar />

      {!activeModule ? (
        // Empty state
        <div className="flex-1 flex flex-col items-center justify-center text-vsc-text-muted gap-4">
          <FileCode2 size={48} strokeWidth={1} />
          <div className="text-center">
            <p className="text-sm font-medium text-vsc-text">No module selected</p>
            <p className="text-xs mt-1">
              Select a module from the Explorer or add one to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Module title bar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-vsc-border bg-vsc-sidebar shrink-0">
            <input
              value={activeModule.title}
              onChange={(e) => updateModuleTitle(activeModule.id, e.target.value)}
              className="bg-transparent text-sm font-medium text-vsc-text focus:outline-none border-b border-transparent focus:border-vsc-accent transition-colors"
            />
            <span className="text-xs text-vsc-text-muted ml-auto">
              {activeModule.type.replace("_", " ").toLowerCase()}
            </span>
          </div>

          {/* Module editor — key forces remount when switching modules */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeModule.type === "RICH_TEXT" && (
              <RichTextModule
                key={activeModule.id}
                moduleId={activeModule.id}
                content={
                  (activeModule.content as RichTextContent) ?? {
                    type: "RICH_TEXT",
                    html: "",
                  }
                }
              />
            )}
            {activeModule.type === "INTERACTIVE_VISUAL" && (
              <VisualModule
                key={activeModule.id}
                content={
                  (activeModule.content as InteractiveVisualContent) ?? {
                    type: "INTERACTIVE_VISUAL",
                    visualType: "flowchart",
                    mermaidDefinition: "flowchart TD\n    A[Start] --> B[End]",
                    annotations: [],
                  }
                }
              />
            )}
            {activeModule.type === "CODE_EDITOR" && (
              <CodeEditorModule
                key={activeModule.id}
                content={
                  (activeModule.content as CodeEditorContent) ?? {
                    type: "CODE_EDITOR",
                    language: "typescript",
                    starterCode: "// Write your code here\n",
                  }
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
