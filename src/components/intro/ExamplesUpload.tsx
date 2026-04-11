"use client";

import { useState } from "react";
import { Link2, FileText, Plus, Trash2, ExternalLink } from "lucide-react";
import type { ExampleReference } from "@/lib/types";

interface Props {
  examples: ExampleReference[];
  onChange: (v: ExampleReference[]) => void;
}

export function ExamplesUpload({ examples, onChange }: Props) {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [urlInput, setUrlInput] = useState("");
  const [urlLabel, setUrlLabel] = useState("");
  const [textInput, setTextInput] = useState("");
  const [textLabel, setTextLabel] = useState("");

  const addUrl = () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;
    const ref: ExampleReference = {
      id: `ex_${Date.now()}`,
      type: "url",
      label: urlLabel.trim() || trimmedUrl,
      value: trimmedUrl,
    };
    onChange([...examples, ref]);
    setUrlInput("");
    setUrlLabel("");
  };

  const addText = () => {
    const trimmedText = textInput.trim();
    if (!trimmedText) return;
    const ref: ExampleReference = {
      id: `ex_${Date.now()}`,
      type: "text",
      label: textLabel.trim() || "Text snippet",
      value: trimmedText,
    };
    onChange([...examples, ref]);
    setTextInput("");
    setTextLabel("");
  };

  const remove = (id: string) => {
    onChange(examples.filter((e) => e.id !== id));
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addUrl();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#A78BFA]/15 flex items-center justify-center">
          <Link2 size={16} className="text-[#A78BFA]" />
        </div>
        <div>
          <h3 className="text-heading text-text-primary">Examples & References</h3>
          <p className="text-xs text-text-secondary">
            Share repos, docs, or text snippets the AI should reference when generating content.
          </p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-bg-primary rounded-lg p-1 border border-border w-fit">
        {(["url", "text"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === m
                ? "bg-signal-blue/15 text-signal-blue"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {m === "url" ? <Link2 size={12} /> : <FileText size={12} />}
            {m === "url" ? "URL / Repo" : "Text Snippet"}
          </button>
        ))}
      </div>

      {/* URL input */}
      {mode === "url" && (
        <div className="space-y-2">
          <input
            value={urlLabel}
            onChange={(e) => setUrlLabel(e.target.value)}
            placeholder="Label (optional) — e.g. 'Main repo', 'Style guide'"
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-disabled focus:outline-none focus:border-signal-blue/60 transition-colors"
          />
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleUrlKeyDown}
              placeholder="https://github.com/your-org/your-repo"
              className="flex-1 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-disabled focus:outline-none focus:border-signal-blue/60 transition-colors font-mono"
            />
            <button
              type="button"
              onClick={addUrl}
              disabled={!urlInput.trim()}
              className="px-3 py-2 rounded-lg bg-signal-blue/15 text-signal-blue hover:bg-signal-blue/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Text input */}
      {mode === "text" && (
        <div className="space-y-2">
          <input
            value={textLabel}
            onChange={(e) => setTextLabel(e.target.value)}
            placeholder="Label — e.g. 'Coding standards excerpt'"
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-disabled focus:outline-none focus:border-signal-blue/60 transition-colors"
          />
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste reference text, code snippets, or documentation excerpts..."
            rows={3}
            className="w-full bg-bg-primary border border-border rounded-lg px-4 py-3 text-body text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/20 transition-all font-mono"
          />
          <button
            type="button"
            onClick={addText}
            disabled={!textInput.trim()}
            className="px-4 py-2 rounded-lg bg-signal-blue/15 text-signal-blue hover:bg-signal-blue/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Add snippet
          </button>
        </div>
      )}

      {/* Added references list */}
      {examples.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">
            Added references ({examples.length})
          </p>
          {examples.map((ex) => (
            <div
              key={ex.id}
              className="flex items-start gap-3 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 group"
            >
              <div className="w-6 h-6 rounded bg-bg-primary flex items-center justify-center shrink-0 mt-0.5">
                {ex.type === "url" ? (
                  <ExternalLink size={12} className="text-signal-blue" />
                ) : (
                  <FileText size={12} className="text-amber-surge" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium truncate">{ex.label}</p>
                <p className="text-xs text-text-secondary truncate font-mono mt-0.5">
                  {ex.type === "url" ? ex.value : `${ex.value.slice(0, 80)}${ex.value.length > 80 ? "..." : ""}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(ex.id)}
                className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-error transition-all shrink-0 mt-0.5"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
