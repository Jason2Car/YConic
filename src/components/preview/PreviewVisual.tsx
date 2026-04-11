"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { InteractiveVisualContent } from "@/lib/mock/project";

interface PreviewVisualProps {
    content: InteractiveVisualContent;
}

export function PreviewVisual({ content }: PreviewVisualProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{
        x: number; y: number; label: string; detail: string;
    } | null>(null);

    const render = useCallback(async () => {
        if (!containerRef.current) return;
        try {
            const mermaid = (await import("mermaid")).default;
            mermaid.initialize({
                startOnLoad: false,
                theme: "default",
                securityLevel: "loose",
                fontFamily: "Inter, system-ui, sans-serif",
            });
            const id = `preview-mermaid-${Date.now()}`;
            const { svg } = await mermaid.render(id, content.mermaidDefinition);
            if (containerRef.current) {
                containerRef.current.innerHTML = svg;
                setError(null);
                const svgEl = containerRef.current.querySelector("svg");
                if (svgEl) {
                    svgEl.style.maxWidth = "100%";
                    svgEl.style.height = "auto";
                    content.annotations?.forEach((ann) => {
                        const node = svgEl.querySelector(`#${ann.nodeId}`) || svgEl.querySelector(`[id="${ann.nodeId}"]`);
                        if (node) {
                            (node as HTMLElement).style.cursor = "pointer";
                            node.addEventListener("mouseenter", (e) => {
                                const rect = (e.target as Element).closest("g")?.getBoundingClientRect();
                                if (rect) setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, label: ann.label, detail: ann.detail });
                            });
                            node.addEventListener("mouseleave", () => setTooltip(null));
                        }
                    });
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
    }, [content]);

    useEffect(() => { render(); }, [render]);

    if (error) {
        return (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                Diagram error: {error}
            </div>
        );
    }

    return (
        <>
            <div ref={containerRef} className="flex justify-center py-4" style={{ minHeight: 150 }} />
            {tooltip && (
                <div className="fixed z-50 pointer-events-none" style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}>
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{tooltip.label}</p>
                        <p className="text-xs text-gray-500">{tooltip.detail}</p>
                    </div>
                </div>
            )}
        </>
    );
}
