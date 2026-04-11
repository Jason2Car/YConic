"use client";

import type { RichTextContent } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";

export function PreviewRichText({ content }: { content: RichTextContent }) {
  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.html) }}
    />
  );
}
