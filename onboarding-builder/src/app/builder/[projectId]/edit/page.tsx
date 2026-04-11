"use client";

import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useBuilderStore } from "@/lib/store";
import { useEffect, useState, useRef } from "react";
import type { ProposedChange } from "@/lib/ai/schemas";

export default function EditPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ projectId: string }>();
  const utils = trpc.useUtils();
  const project = trpc.project.getById.useQuery({ id: params.projectId }, { enabled: status === "authenticated" });
  const createSession = trpc.session.create.useMutation();
  const applyChange = trpc.session.applyChange.useMutation();
  const undo = trpc.session.undo.useMutation();

  const store = useBuilderStore();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Create session on mount
  useEffect(() => {
    if (status === "authenticated" && !store.sessionId) {
      createSession.mutate({ projectId: params.projectId }, {
        onSuccess: (s) => store.setSessionId(s.id),
      });
    }
  }, [status, params.projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [store.messages]);

  if (status === "loading") return <div className="flex min-h-screen items-center justify-center"><p className="text-zinc-400">Loading...</p></div>;
  if (status === "unauthenticated") redirect("/login");
  if (project.data?.stage !== "EDIT") redirect(`/builder/${params.projectId}/intro`);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");
    store.addMessage({ role: "user", content: userMsg });
    setStreaming(true);

    try {
      const snapshot = {
        id: project.data!.id,
        title: project.data!.title,
        description: project.data!.description,
        modules: project.data!.modules.map((m) => ({
          id: m.id, type: m.type, title: m.title, position: m.position, content: m.content,
        })),
      };

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...store.messages, { role: "user", content: userMsg }],
          projectSnapshot: snapshot,
        }),
      });

      if (!res.ok) {
        store.addMessage({ role: "assistant", content: "Sorry, I encountered an error. Please try again." });
        setStreaming(false);
        return;
      }

      const text = await res.text();
      try {
        const change: ProposedChange = JSON.parse(text);
        store.setPendingChange(change);
        store.addMessage({ role: "assistant", content: change.description });
      } catch {
        store.addMessage({ role: "assistant", content: text || "I couldn't generate a valid change. Please try rephrasing." });
      }
    } catch {
      store.addMessage({ role: "assistant", content: "Connection error. Please try again." });
    }
    setStreaming(false);
  };

  const handleApprove = async () => {
    if (!store.pendingChange || !store.sessionId) return;
    store.setIsSaving(true);
    store.setSaveError(null);
    try {
      await applyChange.mutateAsync({ sessionId: store.sessionId, change: store.pendingChange });
      store.setPendingChange(null);
      utils.project.getById.invalidate({ id: params.projectId });
    } catch {
      store.setSaveError("Auto-save failed. Your changes are preserved in this session.");
    }
    store.setIsSaving(false);
  };

  const handleReject = () => {
    store.setPendingChange(null);
    store.addMessage({ role: "assistant", content: "Change rejected. What would you like me to do instead?" });
  };

  const handleUndo = async () => {
    if (!store.sessionId) return;
    try {
      await undo.mutateAsync({ sessionId: store.sessionId });
      utils.project.getById.invalidate({ id: params.projectId });
      store.addMessage({ role: "assistant", content: "Last change undone." });
    } catch {
      store.addMessage({ role: "assistant", content: "Nothing to undo." });
    }
  };

  return (
    <div className="flex h-screen">
      {/* Chat Panel */}
      <div className="flex w-96 flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <a href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300">← Dashboard</a>
            <h2 className="text-sm font-medium truncate">{project.data?.title}</h2>
          </div>
          <button onClick={handleUndo} className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-white">Undo</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {store.messages.map((msg, i) => (
            <div key={i} className={`text-sm ${msg.role === "user" ? "text-zinc-200" : "text-zinc-400"}`}>
              <span className="text-xs font-medium text-zinc-500">{msg.role === "user" ? "You" : "AI"}</span>
              <p className="mt-0.5">{msg.content}</p>
            </div>
          ))}
          {streaming && <p className="text-xs text-zinc-500 animate-pulse">AI is thinking...</p>}
          <div ref={chatEndRef} />
        </div>

        {/* Approve/Reject bar */}
        {store.pendingChange && (
          <div className="border-t border-zinc-800 p-3 space-y-2">
            <p className="text-xs text-zinc-400">Proposed: {store.pendingChange.description}</p>
            <div className="flex gap-2">
              <button onClick={handleApprove} disabled={store.isSaving}
                className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                {store.isSaving ? "Saving..." : "Approve"}
              </button>
              <button onClick={handleReject} className="flex-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-white">
                Reject
              </button>
            </div>
          </div>
        )}

        {store.saveError && <p className="px-4 pb-2 text-xs text-red-400">{store.saveError}</p>}

        {/* Input */}
        <div className="border-t border-zinc-800 p-3">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Tell the AI what to add or change..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
            <button onClick={sendMessage} disabled={streaming || !input.trim()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-2xl font-semibold mb-6">{project.data?.title}</h1>
        {project.data?.modules.length === 0 && <p className="text-zinc-500">No modules yet. Use the chat to add content.</p>}
        <div className="space-y-4">
          {project.data?.modules.map((mod) => (
            <div key={mod.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{mod.type}</span>
                <h3 className="text-sm font-medium">{mod.title}</h3>
              </div>
              {mod.content && typeof mod.content === "object" && "description" in (mod.content as Record<string, unknown>) && (
                <p className="text-xs text-zinc-500">{(mod.content as { description: string }).description}</p>
              )}
              {mod.content && typeof mod.content === "object" && "html" in (mod.content as Record<string, unknown>) && (
                <div className="prose prose-invert prose-sm mt-2" dangerouslySetInnerHTML={{ __html: (mod.content as { html: string }).html }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
