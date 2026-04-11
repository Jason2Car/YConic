"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { InteractiveVisualContent } from "@/lib/mock/project";

interface VisualModuleProps {
    content: InteractiveVisualContent;
    onChange?: (content: Partial<InteractiveVisualContent>) => void;
    readOnly?: boolean;
}

export function VisualModule({
    content,
    onChange,
    readOnly = false,
}: VisualModuleProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mermaidCode, setMermaidCode] = useState(content.mermaidDefinition);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        label: string;
        detail: string;
    } | null>(null);

    const renderMermaid = useCallback(async (code: string) => {
        if (!containerRef.current) return;

        try {
            // Dynamically import mermaid to avoid SSR issues
            const mermaid = (await import("mermaid")).default;

            mermaid.initialize({
                startOnLoad: false,
                theme: "dark",
                themeVariables: {
                    primaryColor: "#007acc",
                    primaryTextColor: "#cccccc",
                    primaryBorderColor: "#3e3e42",
                    lineColor: "#858585",
                    secondaryColor: "#2d2d30",
                    tertiaryColor: "#252526",
                    background: "#1e1e1e",
                    mainBkg: "#2d2d30",
                    nodeBorder: "#3e3e42",
                    clusterBkg: "#252526",
                    titleColor: "#cccccc",
                    edgeLabelBackground: "#2d2d30",
                    attributeBackgroundColorEven: "#252526",
                    attributeBackgroundColorOdd: "#2d2d30",
                },
                securityLevel: "loose",
                fontFamily: "Consolas, Monaco, monospace",
            });

            const id = `mermaid-${Date.now()}`;
            const { svg } = await mermaid.render(id, code);

            if (containerRef.current) {
                containerRef.current.innerHTML = svg;
                setRenderError(null);

                // Attach annotation tooltips
                if (content.annotations.length > 0) {
                    const svgEl = containerRef.current.querySelector("svg");
                    if (svgEl) {
                        svgEl.style.maxWidth = "100%";
                        svgEl.style.height = "auto";

                        content.annotations.forEach((annotation) => {
                            // Try to find the node by various selectors
                            const selectors = [
                                `#${annotation.nodeId}`,
                                `[id="${annotation.nodeId}"]`,
                                `.node#${annotation.nodeId}`,
                            ];

                            for (const selector of selectors) {
                                const node = svgEl.querySelector(selector);
                                if (node) {
                                    (node as HTMLElement).style.cursor = "pointer";
                                    node.addEventListener("mouseenter", (e) => {
                                        const rect = (e.target as Element)
                                            .closest("g")
                                            ?.getBoundingClientRect();
                                        if (rect) {
                                            setTooltip({
                                                x: rect.left + rect.width / 2,
                                                y: rect.top - 8,
                                                label: annotation.label,
                                                detail: annotation.detail,
                                            });
                                        }
                                    });
                                    node.addEventListener("mouseleave", () => {
                                        setTooltip(null);
                                    });
                                    break;
                                }
                            }
                        });
                    }
                }
            }
        } catch (err) {
            setRenderError(
                err instanceof Error ? err.message : "Failed to render diagram"
            );
        }
    }, [content.annotations]);

    useEffect(() => {
        renderMermaid(mermaidCode);
    }, [mermaidCode, renderMermaid]);

    const handleCodeChange = (newCode: string) => {
        setMermaidCode(newCode);
        onChange?.({ mermaidDefinition: newCode });
    };

    return (
        <div
            className="flex flex-col h-full"
            style={{ backgroundColor: "#1e1e1e" }}
        >
            {/* Toolbar */}
            <div
                className="flex items-center justify-between px-3 py-1.5 shrink-0"
                style={{
                    backgroundColor: "#2d2d30",
                    borderBottom: "1px solid #3e3e42",
                }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: "#858585" }}>
                        {content.visualType === "flowchart"
                            ? "Flowchart"
                            : content.visualType === "sequence"
                                ? "Sequence Diagram"
                                : "Annotated Steps"}
                    </span>
                    {content.annotations.length > 0 && (
                        <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                                backgroundColor: "#2d2d30",
                                color: "#858585",
                                border: "1px solid #3e3e42",
                            }}
                        >
                            {content.annotations.length} annotations
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!readOnly && (
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className="text-xs px-2 py-1 rounded transition-colors"
                            style={{
                                backgroundColor: isEditMode ? "#3e3e42" : "transparent",
                                color: isEditMode ? "#cccccc" : "#858585",
                                border: "1px solid #3e3e42",
                            }}
                        >
                            {isEditMode ? "Preview" : "Edit Diagram"}
                        </button>
                    )}
                    <button
                        onClick={() => renderMermaid(mermaidCode)}
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{
                            color: "#007acc",
                            border: "1px solid #007acc",
                        }}
                        title="Regenerate diagram"
                    >
                        ↻ Regenerate with AI
                    </button>
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 min-h-0 flex">
                {/* Edit panel */}
                {isEditMode && !readOnly && (
                    <div
                        className="w-1/2 flex flex-col"
                        style={{ borderRight: "1px solid #3e3e42" }}
                    >
                        <div
                            className="px-3 py-1 text-xs"
                            style={{
                                backgroundColor: "#252526",
                                borderBottom: "1px solid #3e3e42",
                                color: "#858585",
                            }}
                        >
                            Mermaid Syntax
                        </div>
                        <textarea
                            value={mermaidCode}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            className="flex-1 p-3 font-mono text-xs resize-none outline-none"
                            style={{
                                backgroundColor: "#1a1a1a",
                                color: "#d4d4d4",
                                border: "none",
                            }}
                            spellCheck={false}
                        />
                    </div>
                )}

                {/* Preview panel */}
                <div
                    className={`${isEditMode && !readOnly ? "w-1/2" : "w-full"} flex flex-col overflow-auto`}
                >
                    {renderError ? (
                        <div className="flex-1 flex items-center justify-center p-6">
                            <div
                                className="text-center p-4 rounded"
                                style={{
                                    backgroundColor: "#2d1b1b",
                                    border: "1px solid #5a2020",
                                    color: "#f48771",
                                }}
                            >
                                <p className="text-sm font-medium mb-2">Diagram Error</p>
                                <p className="text-xs font-mono">{renderError}</p>
                            </div>
                        </div>
                    ) : (
                        <div
                            ref={containerRef}
                            className="flex-1 flex items-center justify-center p-6 mermaid-container"
                            style={{ minHeight: "200px" }}
                        />
                    )}
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: "translate(-50%, -100%)",
                    }}
                >
                    <div
                        className="rounded p-2 shadow-lg max-w-xs"
                        style={{
                            backgroundColor: "#252526",
                            border: "1px solid #3e3e42",
                        }}
                    >
                        <p
                            className="text-xs font-semibold mb-1"
                            style={{ color: "#cccccc" }}
                        >
                            {tooltip.label}
                        </p>
                        <p className="text-xs" style={{ color: "#858585" }}>
                            {tooltip.detail}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
