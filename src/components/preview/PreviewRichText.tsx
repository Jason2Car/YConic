"use client";

import type { RichTextContent } from "@/lib/mock/project";

interface PreviewRichTextProps {
    content: RichTextContent;
}

export function PreviewRichText({ content }: PreviewRichTextProps) {
    return (
        <div
            className="prose prose-gray max-w-none
        prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600
        prose-strong:text-gray-800 prose-a:text-blue-600
        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
            dangerouslySetInnerHTML={{ __html: content.html }}
        />
    );
}
