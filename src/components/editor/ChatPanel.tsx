"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStore, type ChatMessage, type ProposedChange } from "@/lib/store/chatStore";
import { useEditorStore } from "@/lib/store/editorStore";
import { useProjectStore } from "@/lib/store/projectStore";
import type { ModuleContent, ModuleType } from "@/lib/mock/project";
import type { FlatChange } from "@/app/api/ai/chat/route";

function flatChangeToModuleContent(data: FlatChange): ModuleContent | null {
    const ct = data.contentType;
    console.log("[ChatPanel] Building content for type:", ct, "data keys:", Object.keys(data));

    if (!ct) return null;

    switch (ct) {
        case "RICH_TEXT":
            return { type: "RICH_TEXT", html: data.html || "<p>New content</p>" };
        case "CODE_EDITOR": {
            // Grok sometimes puts code in different fields — be resilient
            const code = data.starterCode || data.solution || "// Write your code here\nconsole.log('Hello!');";
            const lang = data.language || "javascript";
            console.log("[ChatPanel] CODE_EDITOR — lang:", lang, "code length:", code.length);
            return {
                type: "CODE_EDITOR",
                language: lang,
                starterCode: code,
                hint: data.hint || undefined,
                solution: data.solution || undefined,
                expectedOutput: data.expectedOutput || undefined,
            };
        }
        case "INTERACTIVE_VISUAL":
            return {
                type: "INTERACTIVE_VISUAL",
                visualType: data.visualType || "flowchart",
                mermaidDefinition: data.mermaidDefinition || "flowchart TD\n  A[Start] --> B[End]",
                annotations: data.annotations || [],
            };
        default:
            return null;
    }
}

function ProposedChangeCard({
    message,
    change,
}: {
    message: ChatMessage;
    change: ProposedChange;
}) {
    const { updateChangeStatus } = useChatStore();
    const { setSaveStatus } = useEditorStore();
    const { addModule, updateModule, deleteModule } = useProjectStore();

    const handleApprove = () => {
        updateChangeStatus(message.id, "approved");
        setSaveStatus("saving");

        try {
            const data = change.data as FlatChange;
            if (!data) { setSaveStatus("error"); return; }

            switch (data.changeType) {
                case "add_module": {
                    const content = flatChangeToModuleContent(data);
                    console.log("[Apply] add_module — contentType:", data.contentType, "moduleType:", data.moduleType, "content:", JSON.stringify(content)?.slice(0, 200));
                    if (!content) { setSaveStatus("error"); return; }
                    const newId = addModule(
                        (data.contentType ?? data.moduleType ?? "RICH_TEXT") as ModuleType,
                        data.title ?? "New Module",
                        content
                    );
                    useEditorStore.getState().setActiveModule(newId);
                    break;
                }
                case "update_module": {
                    if (!data.moduleId) { setSaveStatus("error"); return; }
                    const content = flatChangeToModuleContent(data);
                    updateModule(data.moduleId, {
                        title: data.title ?? undefined,
                        content: content ?? undefined,
                    });
                    useEditorStore.getState().setActiveModule(data.moduleId);
                    break;
                }
                case "delete_module": {
                    if (!data.moduleId) { setSaveStatus("error"); return; }
                    deleteModule(data.moduleId);
                    break;
                }
            }
            setTimeout(() => setSaveStatus("saved"), 800);
        } catch (err) {
            console.error("Failed to apply change:", err);
            setSaveStatus("error");
        }
    };

    const handleReject = () => {
        updateChangeStatus(message.id, "rejected");
    };

    const typeColors: Record<string, string> = {
        add_module: "#4ec9b0",
        update_module: "#569cd6",
        delete_module: "#f48771",
    };
    const typeLabels: Record<string, string> = {
        add_module: "Add Module",
        update_module: "Update Module",
        delete_module: "Delete Module",
    };
    const ct = (change.data as FlatChange)?.changeType ?? "add_module";

    return (
        <div className="mt-2 rounded overflow-hidden" style={{ border: "1px solid #3e3e42" }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: "#252526" }}>
                <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{
                        backgroundColor: `${typeColors[ct] ?? "#858585"}22`,
                        color: typeColors[ct] ?? "#858585",
                        border: `1px solid ${typeColors[ct] ?? "#858585"}44`,
                    }}>
                    {typeLabels[ct] ?? "Change"}
                </span>
                <span className="text-xs" style={{ color: "#858585" }}>Proposed Change</span>
            </div>
            <div className="px-3 py-2 text-xs" style={{ backgroundColor: "#1e1e1e", color: "#cccccc" }}>
                {change.description}
            </div>
            {change.status === "pending" && (
                <div className="flex items-center gap-2 px-3 py-2"
                    style={{ backgroundColor: "#252526", borderTop: "1px solid #3e3e42" }}>
                    <button onClick={handleApprove}
                        className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: "#28a745", color: "#fff" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#218838")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#28a745")}>
                        ✓ Apply
                    </button>
                    <button onClick={handleReject}
                        className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: "transparent", color: "#f48771", border: "1px solid #f48771" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f4877122")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        ✗ Reject
                    </button>
                </div>
            )}
            {change.status !== "pending" && (
                <div className="flex items-center gap-1.5 px-3 py-2"
                    style={{ backgroundColor: "#252526", borderTop: "1px solid #3e3e42" }}>
                    <span className="text-xs"
                        style={{ color: change.status === "approved" ? "#28a745" : "#858585" }}>
                        {change.status === "approved" ? "✓ Applied" : "✗ Rejected"}
                    </span>
                </div>
            )}
        </div>
    );
}

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";
    return (
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-3`}>
            <span className="text-xs mb-1 px-1" style={{ color: "#858585" }}>
                {isUser ? "You" : "AI Assistant"}
            </span>
            <div className={`max-w-[85%] rounded px-3 py-2 text-xs leading-relaxed ${isUser ? "rounded-br-none" : "rounded-bl-none"}`}
                style={{
                    backgroundColor: isUser ? "#007acc" : "#2d2d30",
                    color: isUser ? "#ffffff" : "#cccccc",
                    border: isUser ? "none" : "1px solid #3e3e42",
                }}>
                {message.content}
            </div>
            {!isUser && message.proposedChange && (
                <div className="max-w-[85%] w-full">
                    <ProposedChangeCard message={message} change={message.proposedChange} />
                </div>
            )}
            <span className="text-xs mt-1 px-1" style={{ color: "#555" }}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
        </div>
    );
}


export function ChatPanel() {
    const { messages, isLoading, addMessage, setLoading } = useChatStore();
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = useCallback(async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || isLoading) return;

        // Parse @commands to force a content type
        let forceType: string | null = null;
        let cleanedInput = trimmed;
        const commandMatch = trimmed.match(/^@(code|text|visual)\s+/i);
        if (commandMatch) {
            const cmd = commandMatch[1].toLowerCase();
            forceType = cmd === "code" ? "CODE_EDITOR" : cmd === "text" ? "RICH_TEXT" : "INTERACTIVE_VISUAL";
            cleanedInput = trimmed.slice(commandMatch[0].length).trim();
        }

        addMessage({ role: "user", content: trimmed });
        setInputValue("");
        setLoading(true);

        try {
            const modules = useProjectStore.getState().getModules();

            const allMsgs = useChatStore.getState().messages;
            const conversationForApi = allMsgs
                .filter((m) => m.role === "user" || (m.role === "assistant" && !m.proposedChange))
                .slice(-8)
                .map((m) => ({ role: m.role, content: m.content }));

            // Replace the last message with the cleaned input (without @command)
            if (forceType && conversationForApi.length > 0) {
                conversationForApi[conversationForApi.length - 1] = {
                    role: "user",
                    content: cleanedInput,
                };
            }

            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: conversationForApi, modules, forceType }),
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                console.error("API error response:", errBody);
                throw new Error(errBody.details || `API error: ${response.status}`);
            }

            const data = await response.json() as FlatChange;
            console.log("[ChatPanel] API response:", JSON.stringify(data, null, 2));

            if (data && data.changeType && data.description) {
                addMessage({
                    role: "assistant",
                    content: data.description,
                    proposedChange: {
                        type: data.changeType,
                        description: data.description,
                        status: "pending",
                        data: data,
                    },
                });
            } else {
                addMessage({
                    role: "assistant",
                    content: "I understood your request but couldn't generate a valid change. Could you try being more specific about what you'd like to add or modify?",
                });
            }
        } catch (err) {
            console.error("Chat error:", err);
            const errorMsg = err instanceof Error ? err.message : "Unknown error";
            addMessage({
                role: "assistant",
                content: `Something went wrong: ${errorMsg}. Please check your Google AI API key in .env.local and try again.`,
            });
        } finally {
            setLoading(false);
        }
    }, [inputValue, isLoading, addMessage, setLoading]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: "#1e1e1e" }}>
            <div className="flex items-center justify-between px-3 py-2 shrink-0"
                style={{ backgroundColor: "#2d2d30", borderBottom: "1px solid #3e3e42" }}>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-widest uppercase"
                        style={{ color: "#bbbbbb", letterSpacing: "0.1em" }}>
                        AI Assistant
                    </span>
                    <span className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
                </div>
                <button onClick={() => useChatStore.getState().clearMessages()}
                    className="text-xs px-2 py-0.5 rounded transition-colors"
                    style={{ color: "#858585", border: "1px solid #3e3e42" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#cccccc")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#858585")}
                    title="Clear conversation">
                    Clear
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}
                {isLoading && (
                    <div className="flex items-start mb-3">
                        <div className="rounded rounded-bl-none px-3 py-2 text-xs"
                            style={{ backgroundColor: "#2d2d30", border: "1px solid #3e3e42", color: "#858585" }}>
                            <span className="animate-pulse">AI is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 p-3" style={{ borderTop: "1px solid #3e3e42" }}>
                <div className="flex items-end gap-2 rounded p-2"
                    style={{ backgroundColor: "#2d2d30", border: "1px solid #3e3e42" }}>
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Try: @text about culture, @code python sorting, @visual hiring flow"
                        rows={2}
                        className="flex-1 resize-none outline-none text-xs leading-relaxed bg-transparent"
                        style={{ color: "#cccccc" }}
                    />
                    <button onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        className="shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        style={{
                            backgroundColor: !inputValue.trim() || isLoading ? "#3e3e42" : "#007acc",
                            color: !inputValue.trim() || isLoading ? "#858585" : "#ffffff",
                        }}>
                        Send
                    </button>
                </div>
                <p className="text-xs mt-1.5" style={{ color: "#555" }}>
                    <span style={{ color: "#4ec9b0" }}>@text</span> · <span style={{ color: "#c586c0" }}>@visual</span> · <span style={{ color: "#569cd6" }}>@code</span> to force type · Enter to send
                </p>
            </div>
        </div>
    );
}
