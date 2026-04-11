"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Play, Lightbulb, Eye, EyeOff, RotateCcw } from "lucide-react";
import { useBuilderStore } from "@/lib/store";
import type { CodeEditorContent } from "@/lib/types";

// Monaco is heavy — lazy load it
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-bg-primary text-text-secondary text-sm">
      Loading editor...
    </div>
  ),
});

interface Props {
  moduleId: string;
  content: CodeEditorContent;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export function CodeEditorModule({ moduleId, content }: Props) {
  const { updateModuleContent } = useBuilderStore();
  const [code, setCode] = useState(content.starterCode);
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "output">("editor");

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value ?? "";
    setCode(newCode);
    updateModuleContent(moduleId, { ...content, starterCode: newCode });
  };

  // Define custom Monaco theme matching Deep Navy palette
  const handleEditorWillMount = (monaco: Parameters<NonNullable<React.ComponentProps<typeof MonacoEditor>["beforeMount"]>>[0]) => {
    monaco.editor.defineTheme("deep-navy", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "4A5568", fontStyle: "italic" },
        { token: "keyword", foreground: "3B8BFF" },
        { token: "string", foreground: "1D9E75" },
        { token: "number", foreground: "F0994A" },
        { token: "type", foreground: "A78BFA" },
        { token: "function", foreground: "F1EFE8" },
      ],
      colors: {
        "editor.background": "#0B1120",
        "editor.foreground": "#F1EFE8",
        "editor.lineHighlightBackground": "#1A2236",
        "editor.selectionBackground": "#3B8BFF33",
        "editorLineNumber.foreground": "#4A5568",
        "editorLineNumber.activeForeground": "#8A9BB5",
        "editorCursor.foreground": "#3B8BFF",
        "editor.inactiveSelectionBackground": "#1E2D45",
        "editorIndentGuide.background": "#1E2D45",
        "editorIndentGuide.activeBackground": "#2A3F5F",
        "scrollbarSlider.background": "#1E2D4580",
        "scrollbarSlider.hoverBackground": "#2A3F5F",
      },
    });
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab("output");
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: content.language, code }),
      });
      const data: ExecutionResult = await res.json();
      setOutput(data);
    } catch {
      setOutput({
        stdout: "",
        stderr: "Failed to connect to execution service.",
        exitCode: 1,
        timedOut: false,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(content.starterCode);
    setOutput(null);
    setShowHint(false);
    setShowSolution(false);
  };

  const LANG_MAP: Record<string, string> = {
    python: "python",
    javascript: "javascript",
    typescript: "typescript",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-vsc-border bg-vsc-sidebar shrink-0">
        {/* Language badge */}
        <span className="text-xs px-2 py-0.5 rounded bg-vsc-yellow/20 text-vsc-yellow font-mono">
          {content.language}
        </span>

        {/* Tab switcher */}
        <div className="flex gap-1 ml-2">
          {(["editor", "output"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-2 py-1 rounded capitalize transition-colors ${
                activeTab === tab
                  ? "bg-vsc-accent text-white"
                  : "text-vsc-text-muted hover:text-vsc-text hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {content.hint && (
            <button
              onClick={() => setShowHint((v) => !v)}
              title="Show hint"
              className="text-xs flex items-center gap-1 text-vsc-text-muted hover:text-vsc-yellow transition-colors"
            >
              <Lightbulb size={13} />
              Hint
            </button>
          )}
          {content.solution && (
            <button
              onClick={() => setShowSolution((v) => !v)}
              title="Show solution"
              className="text-xs flex items-center gap-1 text-vsc-text-muted hover:text-vsc-purple transition-colors"
            >
              {showSolution ? <EyeOff size={13} /> : <Eye size={13} />}
              Solution
            </button>
          )}
          <button
            onClick={handleReset}
            title="Reset to starter code"
            className="text-xs flex items-center gap-1 text-vsc-text-muted hover:text-vsc-text transition-colors"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-vsc-green/20 text-vsc-green hover:bg-vsc-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Play size={12} />
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      {/* Hint banner */}
      {showHint && content.hint && (
        <div className="px-4 py-2 bg-vsc-yellow/10 border-b border-vsc-yellow/30 text-xs text-vsc-yellow">
          💡 {content.hint}
        </div>
      )}

      {/* Solution panel */}
      {showSolution && content.solution && (
        <div className="px-4 py-3 bg-vsc-purple/10 border-b border-vsc-purple/30">
          <p className="text-xs text-vsc-purple font-semibold mb-2">Solution</p>
          <pre className="text-xs font-mono text-vsc-text whitespace-pre-wrap">
            {content.solution}
          </pre>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "editor" ? (
          <MonacoEditor
            height="100%"
            language={LANG_MAP[content.language] ?? "typescript"}
            value={code}
            onChange={handleCodeChange}
            beforeMount={handleEditorWillMount}
            theme="deep-navy"
            options={{
              fontSize: 13,
              fontFamily: "Consolas, Menlo, Monaco, 'Courier New', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              renderLineHighlight: "line",
              tabSize: 2,
              wordWrap: "on",
              padding: { top: 12, bottom: 12 },
            }}
          />
        ) : (
          <div className="h-full overflow-auto p-4 bg-vsc-bg font-mono text-sm">
            {!output ? (
              <p className="text-vsc-text-muted">Run your code to see output here.</p>
            ) : output.timedOut ? (
              <p className="text-vsc-red">⏱ Execution timed out after 15 seconds.</p>
            ) : (
              <>
                {output.stdout && (
                  <div className="mb-3">
                    <p className="text-xs text-vsc-text-muted mb-1 uppercase tracking-wider">
                      stdout
                    </p>
                    <pre className="text-vsc-text whitespace-pre-wrap">{output.stdout}</pre>
                  </div>
                )}
                {output.stderr && (
                  <div>
                    <p className="text-xs text-vsc-red mb-1 uppercase tracking-wider">stderr</p>
                    <pre className="text-vsc-red whitespace-pre-wrap">{output.stderr}</pre>
                  </div>
                )}
                {!output.stdout && !output.stderr && (
                  <p className="text-vsc-text-muted">No output.</p>
                )}
                <p className="text-xs text-vsc-text-muted mt-3">
                  Exit code: {output.exitCode}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
