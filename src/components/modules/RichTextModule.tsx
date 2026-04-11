"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { RichTextContent } from "@/lib/types";

interface RichTextModuleProps {
    content: RichTextContent;
    onChange?: (html: string) => void;
    readOnly?: boolean;
}

const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        title={title}
        className="px-2 py-1 rounded text-xs transition-colors"
        style={{
            backgroundColor: active ? "#3e3e42" : "transparent",
            color: active ? "#cccccc" : "#858585",
            border: active ? "1px solid #555" : "1px solid transparent",
        }}
        onMouseEnter={(e) => {
            if (!active) {
                e.currentTarget.style.backgroundColor = "#2a2d2e";
                e.currentTarget.style.color = "#cccccc";
            }
        }}
        onMouseLeave={(e) => {
            if (!active) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#858585";
            }
        }}
    >
        {children}
    </button>
);

export function RichTextModule({
    content,
    onChange,
    readOnly = false,
}: RichTextModuleProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: "Start writing your module content...",
            }),
        ],
        content: content.html,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "tiptap-editor",
            },
        },
    });

    if (!editor) return null;

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: "#1e1e1e" }}>
            {/* Toolbar */}
            {!readOnly && (
                <div
                    className="flex items-center gap-1 px-3 py-1.5 shrink-0 flex-wrap"
                    style={{
                        backgroundColor: "#2d2d30",
                        borderBottom: "1px solid #3e3e42",
                    }}
                >
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive("bold")}
                        title="Bold (Ctrl+B)"
                    >
                        <strong>B</strong>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive("italic")}
                        title="Italic (Ctrl+I)"
                    >
                        <em>I</em>
                    </ToolbarButton>
                    <div
                        className="w-px h-4 mx-1"
                        style={{ backgroundColor: "#3e3e42" }}
                    />
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 1 }).run()
                        }
                        active={editor.isActive("heading", { level: 1 })}
                        title="Heading 1"
                    >
                        H1
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 2 }).run()
                        }
                        active={editor.isActive("heading", { level: 2 })}
                        title="Heading 2"
                    >
                        H2
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 3 }).run()
                        }
                        active={editor.isActive("heading", { level: 3 })}
                        title="Heading 3"
                    >
                        H3
                    </ToolbarButton>
                    <div
                        className="w-px h-4 mx-1"
                        style={{ backgroundColor: "#3e3e42" }}
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive("bulletList")}
                        title="Bullet List"
                    >
                        • List
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive("orderedList")}
                        title="Ordered List"
                    >
                        1. List
                    </ToolbarButton>
                    <div
                        className="w-px h-4 mx-1"
                        style={{ backgroundColor: "#3e3e42" }}
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        active={editor.isActive("codeBlock")}
                        title="Code Block"
                    >
                        {"</>"}
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        active={editor.isActive("code")}
                        title="Inline Code"
                    >
                        {"`code`"}
                    </ToolbarButton>
                    <div
                        className="w-px h-4 mx-1"
                        style={{ backgroundColor: "#3e3e42" }}
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        active={false}
                        title="Horizontal Rule"
                    >
                        ─
                    </ToolbarButton>
                </div>
            )}

            {/* Editor content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 tiptap-editor">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
