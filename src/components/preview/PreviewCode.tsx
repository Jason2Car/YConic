"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CodeEditorContent } from "@/lib/mock/project";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-48" style={{ backgroundColor: "#1a1a1a" }}>
            <span className="text-xs" style={{ color: "#858585" }}>Loading editor...</span>
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
    const langColors = { python: "#3572A5", javascript: "#f1e05a", typescript: "#3178c6" };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput(null);
        await new Promise((r) => setTimeout(r, 800));
        if (code.includes("print(") || code.includes("console.log")) {
            setOutput("✅ Code executed successfully.\n\n(Output would appear here with a real execution engine)");
        } else {
            setOutput("Program exited with code 0\n(No output — try adding a print/console.log statement)");
        }
        setIsRunning(false);
    };

    return (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #3e3e42" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2"
                style={{ backgroundColor: "#252526", borderBottom: "1px solid #3e3e42" }}>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColors[content.language] }} />
                    <span className="text-xs font-medium" style={{ color: "#cccccc" }}>{langLabels[content.language]}</span>
                </div>
                <button onClick={handleRun} disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors"
                    style={{ backgroundColor: isRunning ? "#1a3a5c" : "#007acc", color: "#ffffff" }}>
                    {isRunning ? "Running..." : "▶ Run"}
                </button>
            </div>

            {/* Editor */}
            <div style={{ height: 250 }}>
                <MonacoEditor height="100%" language={content.language} value={code}
                    onChange={(v) => setCode(v ?? "")} theme="vs-dark"
                    options={{
                        minimap: { enabled: false }, fontSize: 13, lineHeight: 20,
                        scrollBeyondLastLine: false, wordWrap: "on", automaticLayout: true,
                        tabSize: 2, padding: { top: 12, bottom: 12 }
                    }} />
            </div>

            {/* Output */}
            {output && (
                <div style={{ borderTop: "1px solid #3e3e42" }}>
                    <div className="flex items-center justify-between px-3 py-1.5"
                        style={{ backgroundColor: "#252526", borderBottom: "1px solid #3e3e42" }}>
                        <span className="text-xs font-medium" style={{ color: "#858585" }}>OUTPUT</span>
                        <div className="flex items-center gap-2">
                            {content.hint && !showHint && (
                                <button onClick={() => setShowHint(true)}
                                    className="text-xs px-2 py-0.5 rounded"
                                    style={{ color: "#f0a500", border: "1px solid #f0a50055" }}>
                                    💡 Hint
                                </button>
                            )}
                            {content.solution && !showSolution && (
                                <button onClick={() => { setCode(content.solution!); setShowSolution(true); }}
                                    className="text-xs px-2 py-0.5 rounded"
                                    style={{ color: "#4ec9b0", border: "1px solid #4ec9b055" }}>
                                    🔑 Solution
                                </button>
                            )}
                        </div>
                    </div>
                    {showHint && content.hint && (
                        <div className="px-3 py-2 text-xs" style={{ backgroundColor: "#1a1a00", borderBottom: "1px solid #3e3e42", color: "#f0a500" }}>
                            💡 {content.hint}
                        </div>
                    )}
                    <pre className="px-3 py-2 text-xs font-mono whitespace-pre-wrap"
                        style={{ backgroundColor: "#0d0d0d", color: "#4ec9b0", maxHeight: 120, overflow: "auto" }}>
                        {output}
                    </pre>
                </div>
            )}
        </div>
    );
}
