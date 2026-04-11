"use client";

import { useState } from "react";
import { GraduationCap, Plus, X } from "lucide-react";

const PRESET_SKILLS = [
  "HTML & CSS fundamentals",
  "JavaScript / TypeScript basics",
  "React component model",
  "Git version control",
  "REST API concepts",
  "Command-line / terminal usage",
  "Node.js / npm basics",
  "SQL / database fundamentals",
];

interface Props {
  selected: string[];
  customSkills: string;
  onSelectedChange: (v: string[]) => void;
  onCustomChange: (v: string) => void;
}

export function BaselineChecklist({
  selected,
  customSkills,
  onSelectedChange,
  onCustomChange,
}: Props) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (skill: string) => {
    onSelectedChange(
      selected.includes(skill)
        ? selected.filter((s) => s !== skill)
        : [...selected, skill]
    );
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) {
      onSelectedChange([...selected, trimmed]);
    }
    setCustomInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustom();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-velocity-teal/15 flex items-center justify-center">
          <GraduationCap size={16} className="text-velocity-teal" />
        </div>
        <div>
          <h3 className="text-heading text-text-primary">Baseline Requirements</h3>
          <p className="text-xs text-text-secondary">
            What prior knowledge or skills can you assume the new member already has?
          </p>
        </div>
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {PRESET_SKILLS.map((skill) => {
          const isActive = selected.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? "bg-velocity-teal/15 border-velocity-teal/40 text-velocity-teal"
                  : "bg-bg-elevated border-border text-text-secondary hover:border-text-secondary/40 hover:text-text-primary"
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>

      {/* Custom skill input */}
      <div className="flex gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a custom skill..."
          className="flex-1 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-disabled focus:outline-none focus:border-signal-blue/60 transition-colors"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Selected skills summary */}
      {selected.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-text-secondary font-medium">
            Selected skills ({selected.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((skill) => {
              const isPreset = PRESET_SKILLS.includes(skill);
              return (
                <span
                  key={skill}
                  className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium border ${
                    isPreset
                      ? "bg-velocity-teal/10 border-velocity-teal/30 text-velocity-teal"
                      : "bg-signal-blue/10 border-signal-blue/30 text-signal-blue"
                  }`}
                >
                  {!isPreset && (
                    <span className="w-1.5 h-1.5 rounded-full bg-signal-blue shrink-0" />
                  )}
                  {skill}
                  <button
                    type="button"
                    onClick={() => toggle(skill)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-white/10 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional notes */}
      <textarea
        value={customSkills}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder="Any additional notes about expected skill level or background..."
        rows={2}
        className="w-full bg-bg-primary border border-border rounded-lg px-4 py-3 text-body text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/20 transition-all"
      />
    </div>
  );
}
