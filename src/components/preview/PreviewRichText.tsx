"use client";

import type { RichTextContent } from "@/lib/mock/project";

interface PreviewRichTextProps {
    content: RichTextContent;
}

export function PreviewRichText({ content }: PreviewRichTextProps) {
    return (
        <div
            className="prose prose-invert prose-sm max-w-none
        prose-headings:text-gray-200 prose-p:text-gray-400 prose-li:text-gray-400
        prose-strong:text-gray-200 prose-a:text-blue-400 prose-code:text-emerald-400
        prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
        prose-ul:text-gray-400 prose-ol:text-gray-400
        prose-blockquote:border-gray-600 prose-blockquote:text-gray-400
        prose-hr:border-gray-700"
            dangerouslySetInnerHTML={{ __html: content.html }}
        />
    );
}
