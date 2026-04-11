"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CodeEditorContent } from "@/lib/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-400">Loading editor...</span>
        </div>
    ),
});

interface PreviewCodeProps {
    content: CodeEditorContent;
}

export function PreviewCode({ content }: PreviewCodeProps) {
    const [code, setCode] = useState(content.starterCode);
    const [output, setOutput] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showSolution, setShowSolution] = useState(false);

    const langLabels = { python: "Python", javascript: "JavaScript", typescript: "TypeScript" };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput(null);
        try {
            const res = await fetch("/api/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: content.language, code }),
            });
            const result = await res.json();
            if (result.error) {
                setOutput(result.error);
            } else if (result.timedOut) {
                setOutput(result.stderr || "Execution timed out after 15 seconds.");
            } else if (result.exitCode !== 0) {
                setOutput(result.stderr || "Program exited with a non-zero exit code.");
            } else {
                setOutput(result.stdout || "(No output produced)");
            }
        } catch {
            setOutput("Code execution is temporarily unavailable.");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="rounded-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                        {langLabels[content.language]}
                    </span>
                    <span className="text-xs text-gray-400">Code Exercise</span>
                </div>
                <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors"
                    style={{ backgroundColor: isRunning ? "#93c5fd" : "#2563eb" }}
                >
                    {isRunning ? "Running..." : "▶ Run Code"}
                </button>
            </div>

            {/* Editor */}
            <div style={{ height: 280 }}>
                <MonacoEditor
                    height="100%"
                    language={content.language}
                    value={code}
                    onChange={(v) => setCode(v ?? "")}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineHeight: 20,
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        automaticLayout: true,
                        tabSize: 2,
                        padding: { top: 12, bottom: 12 },
                    }}
                />
            </div>

            {/* Output */}
            {output && (
                <div className="border-t border-gray-200">
                    <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-medium text-gray-500">Output</span>
                        <div className="flex items-center gap-2">
                            {content.hint && !showHint && (
                                <button onClick={() => setShowHint(true)}
                                    className="text-xs px-2 py-0.5 rounded border border-amber-300 text-amber-600 hover:bg-amber-50">
                                    💡 Hint
                                </button>
                            )}
                            {content.solution && !showSolution && (
                                <button onClick={() => { setCode(content.solution!); setShowSolution(true); }}
                                    className="text-xs px-2 py-0.5 rounded border border-green-300 text-green-600 hover:bg-green-50">
                                    🔑 Solution
                                </button>
                            )}
                        </div>
                    </div>
                    {showHint && content.hint && (
                        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
                            💡 {content.hint}
                        </div>
                    )}
                    <pre className="px-4 py-3 text-xs font-mono text-gray-700 bg-gray-900 text-green-400 whitespace-pre-wrap" style={{ maxHeight: 150, overflow: "auto" }}>
                        {output}
                    </pre>
                </div>
            )}
        </div>
    );
}
