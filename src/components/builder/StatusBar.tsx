"use client";

import { useBuilderStore } from "@/lib/store";
import { Save, AlertCircle, CheckCircle2, GitBranch, Wifi } from "lucide-react";

export function StatusBar() {
  const { project, isSaving, saveError, revisionHistory } = useBuilderStore();

  return (
    <div className="flex items-center h-6 bg-signal-blue px-3 text-white text-xs shrink-0 gap-4 font-sans"
         style={{ fontSize: "12px" }}>
      {/* Left side */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <GitBranch size={11} />
          <span>main</span>
        </div>
        {project && (
          <span className="text-white/70">
            {project.modules.length} module{project.modules.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {revisionHistory.length > 0 && (
          <span className="text-white/70">{revisionHistory.length} revision{revisionHistory.length !== 1 ? "s" : ""}</span>
        )}

        {isSaving && (
          <div className="flex items-center gap-1 text-white/80">
            <Save size={11} className="animate-pulse" />
            <span>Saving...</span>
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-1 text-yellow-300">
            <AlertCircle size={11} />
            <span>Save failed</span>
          </div>
        )}

        {!isSaving && !saveError && project && (
          <div className="flex items-center gap-1 text-white/70">
            <CheckCircle2 size={11} />
            <span>Saved</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-white/70">
          <Wifi size={11} />
          <span>Connected</span>
        </div>

        <span className="text-white/70">UTF-8</span>
        <span className="text-white/70">TypeScript</span>
      </div>
    </div>
  );
}
