"use client";

import { useState } from "react";
import { Rocket, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { GoalsInput } from "./GoalsInput";
import { BaselineChecklist } from "./BaselineChecklist";
import { RulesInput } from "./RulesInput";
import { ExamplesUpload } from "./ExamplesUpload";
import type { IntroFormData, ExampleReference } from "@/lib/types";

interface Props {
  projectTitle: string;
  onSubmit: (data: IntroFormData) => void;
  isSubmitting: boolean;
}

export function IntroQuestionnaire({ projectTitle, onSubmit, isSubmitting }: Props) {
  const [goals, setGoals] = useState("");
  const [baselineSkills, setBaselineSkills] = useState<string[]>([]);
  const [customSkills, setCustomSkills] = useState("");
  const [rules, setRules] = useState("");
  const [examples, setExamples] = useState<ExampleReference[]>([]);

  const canSubmit = goals.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ goals, baselineSkills, customSkills, rules, examples });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-signal-blue/15 flex items-center justify-center mx-auto mb-5">
          <Rocket size={26} className="text-signal-blue" />
        </div>
        <h1 className="text-display text-text-primary mb-2">
          Set up your project
        </h1>
        <p className="text-body text-text-secondary max-w-md mx-auto">
          Tell the AI about <span className="text-text-primary font-medium">{projectTitle}</span> so
          it can generate a tailored first draft of your onboarding modules.
        </p>
      </div>

      {/* Form sections */}
      <div className="space-y-8">
        {/* 1. Goals */}
        <section className="bg-bg-elevated border border-border rounded-xl p-6">
          <GoalsInput value={goals} onChange={setGoals} />
        </section>

        {/* 2. Baseline */}
        <section className="bg-bg-elevated border border-border rounded-xl p-6">
          <BaselineChecklist
            selected={baselineSkills}
            customSkills={customSkills}
            onSelectedChange={setBaselineSkills}
            onCustomChange={setCustomSkills}
          />
        </section>

        {/* 3. Rules */}
        <section className="bg-bg-elevated border border-border rounded-xl p-6">
          <RulesInput value={rules} onChange={setRules} />
        </section>

        {/* 4. Examples */}
        <section className="bg-bg-elevated border border-border rounded-xl p-6">
          <ExamplesUpload examples={examples} onChange={setExamples} />
        </section>
      </div>

      {/* Submit */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="flex items-center gap-2.5 px-8 py-3 rounded-xl bg-signal-blue hover:bg-signal-blue-hover text-white text-body font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-signal-blue/20 hover:shadow-signal-blue/30"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating modules...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Onboarding Modules
              <ArrowRight size={16} />
            </>
          )}
        </button>
        {!canSubmit && (
          <p className="text-xs text-text-disabled">
            Fill in the learning goals to continue
          </p>
        )}
      </div>
    </form>
  );
}
