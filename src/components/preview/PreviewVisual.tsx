"use client";

import { useEffect, useRef } from "react";
import type { InteractiveVisualContent } from "@/lib/types";

export function PreviewVisual({ content }: { content: InteractiveVisualContent }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: "default" });
      const id = `mermaid-preview-${Date.now()}`;
      mermaid
        .render(id, content.mermaidDefinition)
        .then(({ svg }) => {
          if (ref.current) ref.current.innerHTML = svg;
        })
        .catch(() => {
          if (ref.current) ref.current.textContent = "Diagram could not be rendered.";
        });
    });
  }, [content.mermaidDefinition]);

  return <div ref={ref} className="flex justify-center" />;
}
