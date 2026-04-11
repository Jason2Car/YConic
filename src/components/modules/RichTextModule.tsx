"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading2, Code } from "lucide-react";
import { useBuilderStore } from "@/lib/store";
import type { RichTextContent } from "@/lib/types";

interface Props {
  moduleId: string;
  content: RichTextContent;
}

export function RichTextModule({ moduleId, content }: Props) {
  const { updateModuleContent } = useBuilderStore();

  const editor = useEditor({
    extensions: [StarterKit],
    content: content.html || "<p>Start writing...</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[200px] text-vsc-text text-sm leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      updateModuleContent(moduleId, {
        type: "RICH_TEXT",
        html: editor.getHTML(),
      });
    },
  });

  if (!editor) return null;

  const ToolbarBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-vsc-accent text-white"
          : "text-vsc-text-muted hover:text-vsc-text hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-vsc-border bg-vsc-sidebar shrink-0">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading"
        >
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline Code"
        >
          <Code size={14} />
        </ToolbarBtn>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
