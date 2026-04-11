"use client";

import { useRouter } from "next/navigation";
import { Plus, FolderOpen } from "lucide-react";

const MOCK_PROJECTS = [
  { id: "proj_demo", title: "Web Dev Onboarding", stage: "edit", modules: 3 },
  { id: "proj_2", title: "Design System Intro", stage: "intro", modules: 0 },
];

const STAGE_COLORS: Record<string, string> = {
  init:  "text-text-secondary",
  intro: "text-amber-surge",
  edit:  "text-signal-blue",
};

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      {/* Header */}
      <div className="border-b border-border px-8 py-4 bg-bg-surface flex items-center justify-between">
        <h1 className="text-heading font-medium text-text-primary">
          Onboarding Project Builder
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-signal-blue hover:bg-signal-blue-hover text-white text-body rounded-lg transition-colors font-medium">
          <Plus size={15} />
          New Project
        </button>
      </div>

      {/* Project grid */}
      <div className="px-8 py-8">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4">
          Your Projects
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_PROJECTS.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/builder/${p.id}/edit`)}
              className="text-left p-5 bg-bg-elevated border border-border rounded-xl hover:border-signal-blue/50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <FolderOpen size={20} className="text-amber-surge mt-0.5 shrink-0" />
                <div>
                  <p className="text-body font-medium text-text-primary group-hover:text-chalk transition-colors">
                    {p.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {p.modules} module{p.modules !== 1 ? "s" : ""} ·{" "}
                    <span className={`capitalize ${STAGE_COLORS[p.stage] ?? ""}`}>
                      {p.stage}
                    </span>
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
