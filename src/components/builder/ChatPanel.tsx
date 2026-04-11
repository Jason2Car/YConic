"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Check, X, RotateCcw, Bot, User, Loader2 } from "lucide-react";
import { useBuilderStore } from "@/lib/store";
import type { ChatMessage, ProposedChange } from "@/lib/types";

function MessageBubble({
  message,
  onApprove,
  onReject,
}: {
  message: ChatMessage;
  onApprove: (msg: ChatMessage) => void;
  onReject: (msg: ChatMessage) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? "bg-vsc-accent" : "bg-vsc-green/30"
        }`}
      >
        {isUser ? (
          <User size={12} className="text-white" />
        ) : (
          <Bot size={12} className="text-vsc-green" />
        )}
      </div>

      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Message bubble */}
        <div
          className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? "bg-vsc-accent/20 text-vsc-text"
              : "bg-vsc-sidebar border border-vsc-border text-vsc-text"
          }`}
        >
          {message.content}
        </div>

        {/* Proposed change card */}
        {message.proposedChange && message.status === "pending" && (
          <div className="w-full bg-vsc-bg border border-vsc-accent/40 rounded-lg p-3 mt-1">
            <div className="flex items-start gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-vsc-accent mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-vsc-accent mb-0.5">Proposed Change</p>
                <p className="text-xs text-vsc-text-muted">
                  {message.proposedChange.description}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(message)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-vsc-green/20 text-vsc-green hover:bg-vsc-green/30 transition-colors font-medium"
              >
                <Check size={11} />
                Apply
              </button>
              <button
                onClick={() => onReject(message)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-vsc-red/20 text-vsc-red hover:bg-vsc-red/30 transition-colors"
              >
                <X size={11} />
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Status badge for resolved changes */}
        {message.proposedChange && message.status === "approved" && (
          <span className="text-xs text-vsc-green flex items-center gap-1">
            <Check size={10} /> Applied
          </span>
        )}
        {message.proposedChange && message.status === "rejected" && (
          <span className="text-xs text-vsc-red flex items-center gap-1">
            <X size={10} /> Rejected
          </span>
        )}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { messages, addMessage, updateMessage, applyChange, undo, revisionHistory, isAiThinking, setAiThinking } =
    useBuilderStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
    };
    addMessage(userMsg);
    setInput("");
    setAiThinking(true);

    // Simulate AI response (replace with real /api/ai/chat call)
    await new Promise((r) => setTimeout(r, 1200));

    const aiResponse = generateMockAiResponse(text);
    addMessage(aiResponse);
    setAiThinking(false);
  };

  const handleApprove = (msg: ChatMessage) => {
    if (!msg.proposedChange) return;
    applyChange(msg.proposedChange);
    updateMessage(msg.id, { status: "approved" });
  };

  const handleReject = (msg: ChatMessage) => {
    updateMessage(msg.id, { status: "rejected" });
    const rejectMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: "Got it — I've discarded that change. What would you like to do instead?",
    };
    addMessage(rejectMsg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col w-80 shrink-0 border-l border-vsc-border bg-vsc-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-vsc-border shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-vsc-green" />
          <span className="text-sm font-medium text-vsc-text">AI Assistant</span>
        </div>
        <button
          onClick={undo}
          disabled={revisionHistory.length === 0}
          title="Undo last change"
          className="flex items-center gap-1 text-xs text-vsc-text-muted hover:text-vsc-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw size={13} />
          Undo
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <Bot size={32} strokeWidth={1} className="text-vsc-text-muted" />
            <div>
              <p className="text-sm text-vsc-text">Ask me to help build your module</p>
              <p className="text-xs text-vsc-text-muted mt-1">
                Try: "Add a code exercise for React hooks"
              </p>
            </div>
            {/* Quick prompts */}
            <div className="flex flex-col gap-1.5 w-full mt-2">
              {[
                "Add a welcome rich text module",
                "Add a flowchart showing the request lifecycle",
                "Add a Python code exercise",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-xs text-left px-3 py-2 rounded border border-vsc-border text-vsc-text-muted hover:text-vsc-text hover:border-vsc-accent/50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}

        {isAiThinking && (
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 rounded-full bg-vsc-green/30 flex items-center justify-center shrink-0">
              <Bot size={12} className="text-vsc-green" />
            </div>
            <div className="bg-vsc-sidebar border border-vsc-border rounded-lg px-3 py-2">
              <Loader2 size={14} className="text-vsc-text-muted animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-vsc-border shrink-0">
        <div className="flex gap-2 items-end bg-vsc-bg border border-vsc-border rounded-lg px-3 py-2 focus-within:border-vsc-accent transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI to modify your project..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-vsc-text placeholder-vsc-text-muted resize-none focus:outline-none max-h-32 leading-relaxed"
            style={{ minHeight: "20px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAiThinking}
            className="text-vsc-accent hover:text-vsc-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-vsc-text-muted mt-1.5 text-center">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}

// ─── Mock AI response generator ──────────────────────────────────────────────
function generateMockAiResponse(userText: string): ChatMessage {
  const lower = userText.toLowerCase();

  if (lower.includes("rich text") || lower.includes("welcome") || lower.includes("text")) {
    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: "I'll add a rich text module for you. Here's what I'm proposing:",
      proposedChange: {
        type: "add_module",
        description: "Add a new Rich Text module titled 'Welcome & Overview'",
        payload: {
          type: "RICH_TEXT",
          title: "Welcome & Overview",
          content: {
            type: "RICH_TEXT",
            html: "<h2>Welcome!</h2><p>This module was added by the AI assistant.</p>",
          },
        },
      } as ProposedChange,
      status: "pending",
    };
  }

  if (lower.includes("flowchart") || lower.includes("diagram") || lower.includes("visual")) {
    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: "Here's a flowchart module showing a typical request lifecycle:",
      proposedChange: {
        type: "add_module",
        description: "Add an Interactive Visual module with a flowchart",
        payload: {
          type: "INTERACTIVE_VISUAL",
          title: "System Flowchart",
          content: {
            type: "INTERACTIVE_VISUAL",
            visualType: "flowchart",
            mermaidDefinition:
              "flowchart TD\n    A[User] --> B[Frontend]\n    B --> C[API]\n    C --> D[(Database)]",
            annotations: [],
          },
        },
      } as ProposedChange,
      status: "pending",
    };
  }

  if (lower.includes("code") || lower.includes("exercise") || lower.includes("python") || lower.includes("javascript")) {
    const lang = lower.includes("python")
      ? "python"
      : lower.includes("javascript")
      ? "javascript"
      : "typescript";
    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: `I'll add a ${lang} code exercise module:`,
      proposedChange: {
        type: "add_module",
        description: `Add a Code Editor module with a ${lang} exercise`,
        payload: {
          type: "CODE_EDITOR",
          title: `${lang.charAt(0).toUpperCase() + lang.slice(1)} Exercise`,
          content: {
            type: "CODE_EDITOR",
            language: lang,
            starterCode:
              lang === "python"
                ? "# Write a function that returns the sum of a list\ndef sum_list(nums):\n    pass\n\nprint(sum_list([1, 2, 3]))"
                : "// Write a function that reverses a string\nfunction reverseString(str) {\n  // your code here\n}\n\nconsole.log(reverseString('hello'));",
            hint: "Think about using built-in methods.",
          },
        },
      } as ProposedChange,
      status: "pending",
    };
  }

  return {
    id: `msg_${Date.now()}`,
    role: "assistant",
    content:
      "I can help you add modules, update content, or restructure your project. Try asking me to add a rich text module, a flowchart, or a code exercise.",
  };
}
