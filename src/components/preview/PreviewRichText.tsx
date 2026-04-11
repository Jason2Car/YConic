"use client";

import type { RichTextContent } from "@/lib/types";

export function PreviewRichText({ content }: { content: RichTextContent }) {
  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: content.html }}
    />
  );
}
