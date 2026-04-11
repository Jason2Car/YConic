"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useBuilderStore } from "@/lib/store";
import type { RichTextContent } from "@/lib/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full" style={{ backgroundColor: "#1e1e1e" }}>
            <span className="text-xs" style={{ color: "#858585" }}>Loading editor...</span>
        </div>
    ),
});

interface RichTextModuleProps {
    moduleId?: string;
    content: RichTextContent;
    readOnly?: boolean;
}

// Simple HTML → Markdown converter (no external dep needed at runtime)
function htmlToMarkdown(html: string): string {
    let md = html;
    // Headings
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
    // Bold / italic / strikethrough
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
    md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~");
    // Code
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
    md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "```\n$1\n```\n\n");
    // Links
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
    // Lists
    md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
        return inner.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n") + "\n";
    });
    md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner: string) => {
        let i = 0;
        return inner.replace(/<li[^>]*>(.*?)<\/li>/gi, (_match: string, content: string) => { i++; return `${i}. ${content}\n`; }) + "\n";
    });
    // Paragraphs and breaks
    md = md.replace(/<br\s*\/?>/gi, "\n");
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
    md = md.replace(/<hr\s*\/?>/gi, "---\n\n");
    // Blockquote
    md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
        return inner.split("\n").map((l: string) => `> ${l}`).join("\n") + "\n\n";
    });
    // Strip remaining tags
    md = md.replace(/<[^>]+>/g, "");
    // Decode entities
    md = md.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
    // Clean up extra newlines
    md = md.replace(/\n{3,}/g, "\n\n").trim();
    return md;
}

// Simple Markdown → HTML converter
function markdownToHtml(md: string): string {
    let html = md;
    // Code blocks (before other processing)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>");
    // Headings
    html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    // HR
    html = html.replace(/^---$/gm, "<hr>");
    // Bold / italic
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");
    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // Blockquotes
    html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
    // Unordered lists
    html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
    // Paragraphs — wrap remaining lines
    html = html.split("\n\n").map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol") ||
            trimmed.startsWith("<pre") || trimmed.startsWith("<hr") || trimmed.startsWith("<blockquote")) {
            return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    }).join("\n");
    return html;
}

export function RichTextModule({ moduleId, content, readOnly = false }: RichTextModuleProps) {
    const updateModuleContent = useBuilderStore((s) => s.updateModuleContent);

    const initialMarkdown = useMemo(() => htmlToMarkdown(content.html || ""), [content.html]);
    const [markdown, setMarkdown] = useState(initialMarkdown);

    // Sync when switching modules
    useEffect(() => {
        setMarkdown(htmlToMarkdown(content.html || ""));
    }, [moduleId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = useCallback((value: string | undefined) => {
        const md = value ?? "";
        setMarkdown(md);
        if (moduleId) {
            updateModuleContent(moduleId, { type: "RICH_TEXT", html: markdownToHtml(md) });
        }
    }, [moduleId, updateModuleContent]);

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: "#1e1e1e" }}>
            {/* File tab */}
            <div className="flex items-center h-8 shrink-0" style={{ backgroundColor: "#252526", borderBottom: "1px solid #1e1e1e" }}>
                <div className="flex items-center gap-1.5 px-3 h-full" style={{ backgroundColor: "#1e1e1e", borderRight: "1px solid #252526", borderTop: "1px solid #007acc" }}>
                    <span className="text-xs" style={{ color: "#cccccc" }}>📄 content.md</span>
                </div>
                <div className="flex-1" />
                {!readOnly && (
                    <span className="text-xs px-3" style={{ color: "#858585" }}>Markdown</span>
                )}
            </div>

            {/* Monaco editor */}
            <div className="flex-1 min-h-0">
                <MonacoEditor
                    height="100%"
                    language="markdown"
                    value={markdown}
                    onChange={readOnly ? undefined : handleChange}
                    theme="vs-dark"
                    options={{
                        readOnly,
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineHeight: 22,
                        fontFamily: "Consolas, 'Courier New', monospace",
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        automaticLayout: true,
                        tabSize: 2,
                        renderLineHighlight: "line",
                        cursorBlinking: "smooth",
                        smoothScrolling: true,
                        padding: { top: 16, bottom: 16 },
                        lineNumbers: "on",
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 8,
                        renderWhitespace: "none",
                    }}
                />
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-3 h-5 shrink-0 text-xs"
                style={{ backgroundColor: "#007acc", color: "#fff" }}>
                <span>Markdown</span>
                <div className="flex items-center gap-3">
                    <span>Ln {markdown.split("\n").length}</span>
                    <span>UTF-8</span>
                </div>
            </div>
        </div>
    );
}
