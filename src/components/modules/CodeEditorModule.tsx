"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { CodeEditorContent } from "@/lib/mock/project";

// Lazy load Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div
            className="flex items-center justify-center h-full"
            style={{ backgroundColor: "#1e1e1e" }}
        >
            <div className="text-xs" style={{ color: "#858585" }}>
                Loading editor...
            </div>
        </div>
    ),
});

interface CodeEditorModuleProps {
    content: CodeEditorContent;
    onChange?: (content: Partial<CodeEditorContent>) => void;
    readOnly?: boolean;
}

type Language = "python" | "javascript" | "typescript";

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
    { value: "python", label: "Python" },
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
];

export function CodeEditorModule({
    content,
    onChange,
    readOnly = false,
}: CodeEditorModuleProps) {
    const [language, setLanguage] = useState<Language>(content.language);
    const [code, setCode] = useState(content.starterCode);
    const [output, setOutput] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [outputType, setOutputType] = useState<"success" | "error" | "timeout">("success");

    const handleLanguageChange = useCallback(
        (newLang: Language) => {
            setLanguage(newLang);
            onChange?.({ language: newLang });
        },
        [onChange]
    );

    const handleCodeChange = useCallback(
        (value: string | undefined) => {
            const newCode = value ?? "";
            setCode(newCode);
            onChange?.({ starterCode: newCode });
        },
        [onChange]
    );

    const handleRun = async () => {
        setIsRunning(true);
        setOutput(null);
        setShowHint(false);
        setShowSolution(false);

        // Mock execution for now (no real Piston API)
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Simulate output based on code content
        if (code.includes("console.log") || code.includes("print(")) {
            setOutput("✅ Code executed successfully\n\n🔍 Checking your development environment...\n✅ Node.js version: v20.11.0\n✅ npm version: 10.2.4\n✅ Git version: git version 2.43.0\n\n✨ Environment check complete!");
            setOutputType("success");
        } else if (code.includes("throw") || code.includes("raise")) {
            setOutput("❌ RuntimeError: An error occurred\n  at line 5\n  at runChecks (script.ts:12:5)");
            setOutputType("error");
        } else {
            setOutput("Program exited with code 0\n(No output produced)");
            setOutputType("success");
        }

        setIsRunning(false);
    };

    const handleRevealSolution = () => {
        if (content.solution) {
            setCode(content.solution);
            setShowSolution(true);
        }
    };

    return (
        <div
            className="flex flex-col h-full"
            style={{ backgroundColor: "#1e1e1e" }}
        >
            {/* Toolbar */}
            <div
                className="flex items-center justify-between px-3 py-1.5 shrink-0"
                style={{
                    backgroundColor: "#2d2d30",
                    borderBottom: "1px solid #3e3e42",
                }}
            >
                <div className="flex items-center gap-2">
                    {/* Language selector */}
                    <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value as Language)}
                        disabled={readOnly}
                        className="text-xs px-2 py-1 rounded outline-none cursor-pointer"
                        style={{
                            backgroundColor: "#3c3c3c",
                            color: "#cccccc",
                            border: "1px solid #3e3e42",
                        }}
                    >
                        {LANGUAGE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <span className="text-xs" style={{ color: "#858585" }}>
                        {readOnly ? "Read-only" : "Edit mode"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Run button */}
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors"
                        style={{
                            backgroundColor: isRunning ? "#1a5276" : "#007acc",
                            color: "#ffffff",
                            opacity: isRunning ? 0.7 : 1,
                        }}
                    >
                        {isRunning ? (
                            <>
                                <span className="animate-spin">⟳</span>
                                Running...
                            </>
                        ) : (
                            <>▶ Run</>
                        )}
                    </button>
                </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
                <MonacoEditor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={handleCodeChange}
                    theme="vs-dark"
                    options={{
                        readOnly,
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineHeight: 20,
                        fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        automaticLayout: true,
                        tabSize: 2,
                        renderLineHighlight: "line",
                        cursorBlinking: "smooth",
                        smoothScrolling: true,
                        padding: { top: 12, bottom: 12 },
                    }}
                />
            </div>

            {/* Output panel */}
            {output !== null && (
                <div
                    className="shrink-0"
                    style={{
                        borderTop: "1px solid #3e3e42",
                        maxHeight: "200px",
                    }}
                >
                    {/* Output header */}
                    <div
                        className="flex items-center justify-between px-3 py-1"
                        style={{
                            backgroundColor: "#2d2d30",
                            borderBottom: "1px solid #3e3e42",
                        }}
                    >
                        <span className="text-xs font-medium" style={{ color: "#858585" }}>
                            OUTPUT
                        </span>
                        <div className="flex items-center gap-2">
                            {outputType === "error" && content.hint && !showHint && (
                                <button
                                    onClick={() => setShowHint(true)}
                                    className="text-xs px-2 py-0.5 rounded transition-colors"
                                    style={{
                                        color: "#f0a500",
                                        border: "1px solid #f0a500",
                                    }}
                                >
                                    💡 Reveal Hint
                                </button>
                            )}
                            {outputType === "error" && content.solution && !showSolution && (
                                <button
                                    onClick={handleRevealSolution}
                                    className="text-xs px-2 py-0.5 rounded transition-colors"
                                    style={{
                                        color: "#4ec9b0",
                                        border: "1px solid #4ec9b0",
                                    }}
                                >
                                    🔑 Reveal Solution
                                </button>
                            )}
                            <button
                                onClick={() => setOutput(null)}
                                className="text-xs"
                                style={{ color: "#858585" }}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Hint */}
                    {showHint && content.hint && (
                        <div
                            className="px-3 py-2 text-xs"
                            style={{
                                backgroundColor: "#1a1a00",
                                borderBottom: "1px solid #3e3e42",
                                color: "#f0a500",
                            }}
                        >
                            💡 <strong>Hint:</strong> {content.hint}
                        </div>
                    )}

                    {/* Output content */}
                    <div
                        className="px-3 py-2 overflow-y-auto font-mono text-xs whitespace-pre-wrap"
                        style={{
                            backgroundColor: "#0d0d0d",
                            color: outputType === "error" ? "#f48771" : "#4ec9b0",
                            maxHeight: "150px",
                        }}
                    >
                        {output}
                    </div>
                </div>
            )}
        </div>
    );
}
