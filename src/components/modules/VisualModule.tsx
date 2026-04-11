"use client";

import { useEffect, useRef, useState } from "react";
import { useBuilderStore } from "@/lib/store";
import type { InteractiveVisualContent } from "@/lib/types";

interface Props {
  moduleId: string;
  content: InteractiveVisualContent;
}

export function VisualModule({ moduleId, content }: Props) {
  const { updateModuleContent } = useBuilderStore();
  const [editMode, setEditMode] = useState(false);
  const [draftDefinition, setDraftDefinition] = useState(content.mermaidDefinition);
  const [renderError, setRenderError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    renderDiagram(content.mermaidDefinition);
  }, [content.mermaidDefinition]);

  const renderDiagram = async (definition: string) => {
    if (!diagramRef.current) return;
    try {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#3B8BFF",       // Signal Blue
          primaryTextColor: "#F1EFE8",   // Chalk
          primaryBorderColor: "#1E2D45", // border
          lineColor: "#8A9BB5",          // text-secondary
          secondaryColor: "#1A2236",     // bg-elevated
          tertiaryColor: "#111827",      // bg-surface
          background: "#0B1120",         // bg-primary
          mainBkg: "#1A2236",
          nodeBorder: "#1E2D45",
          clusterBkg: "#111827",
          titleColor: "#F1EFE8",
          edgeLabelBackground: "#0B1120",
          fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
        },
      });
      const id = `mermaid-${moduleId}-${Date.now()}`;
      const { svg } = await mermaid.render(id, definition);
      diagramRef.current.innerHTML = svg;
      setRenderError(null);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : "Diagram render error");
    }
  };

  const handleSave = () => {
    updateModuleContent(moduleId, {
      ...content,
      mermaidDefinition: draftDefinition,
    });
    setEditMode(false);
    renderDiagram(draftDefinition);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-vsc-border bg-vsc-sidebar shrink-0">
        <span className="text-xs text-vsc-text-muted">
          {content.visualType.replace("_", " ")}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              editMode
                ? "bg-vsc-accent text-white"
                : "text-vsc-text-muted hover:text-vsc-text hover:bg-white/10"
            }`}
          >
            {editMode ? "Preview" : "Edit Mermaid"}
          </button>
          {editMode && (
            <button
              onClick={handleSave}
              className="text-xs px-2 py-1 rounded bg-vsc-green/20 text-vsc-green hover:bg-vsc-green/30 transition-colors"
            >
              Apply
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {editMode ? (
          <div className="flex flex-col gap-3 h-full">
            <p className="text-xs text-vsc-text-muted">Edit the Mermaid diagram definition:</p>
            <textarea
              value={draftDefinition}
              onChange={(e) => setDraftDefinition(e.target.value)}
              className="flex-1 bg-vsc-bg border border-vsc-border rounded p-3 text-sm font-mono text-vsc-text resize-none focus:outline-none focus:border-vsc-accent"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {renderError ? (
              <div className="text-vsc-red text-sm p-3 bg-vsc-red/10 rounded border border-vsc-red/30 w-full">
                <p className="font-semibold mb-1">Diagram Error</p>
                <p className="font-mono text-xs">{renderError}</p>
              </div>
            ) : (
              <div
                ref={diagramRef}
                className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
              />
            )}

            {/* Annotations */}
            {content.annotations.length > 0 && (
              <div className="w-full border-t border-vsc-border pt-3">
                <p className="text-xs text-vsc-text-muted mb-2 uppercase tracking-wider">
                  Annotations
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {content.annotations.map((ann) => (
                    <div
                      key={ann.nodeId}
                      className="bg-vsc-sidebar rounded p-2 border border-vsc-border"
                    >
                      <p className="text-xs font-semibold text-vsc-blue mb-0.5">{ann.label}</p>
                      <p className="text-xs text-vsc-text-muted">{ann.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
