"use client";

import { Target } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function GoalsInput({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-signal-blue/15 flex items-center justify-center">
          <Target size={16} className="text-signal-blue" />
        </div>
        <div>
          <h3 className="text-heading text-text-primary">Learning Goals</h3>
          <p className="text-xs text-text-secondary">
            What should a new team member know or be able to do after completing this?
          </p>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Understand our frontend architecture, be able to set up the dev environment, know how to submit a PR following our conventions..."
        rows={5}
        className="w-full bg-bg-primary border border-border rounded-lg px-4 py-3 text-body text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/20 transition-all"
      />
    </div>
  );
}
