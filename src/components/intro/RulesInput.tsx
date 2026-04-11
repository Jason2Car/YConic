"use client";

import { ShieldCheck } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function RulesInput({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-surge/15 flex items-center justify-center">
          <ShieldCheck size={16} className="text-amber-surge" />
        </div>
        <div>
          <h3 className="text-heading text-text-primary">Rules & Style Guide</h3>
          <p className="text-xs text-text-secondary">
            Any conventions, tone, formatting rules, or constraints the onboarding content should follow?
          </p>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Use casual but professional tone, include code examples in TypeScript only, keep each module under 5 minutes of reading time, always include a hands-on exercise..."
        rows={4}
        className="w-full bg-bg-primary border border-border rounded-lg px-4 py-3 text-body text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/20 transition-all"
      />
    </div>
  );
}
