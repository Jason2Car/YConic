"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IntroQuestionnaire } from "@/components/intro/IntroQuestionnaire";
import { useBuilderStore } from "@/lib/store";
import { MOCK_PROJECT } from "@/lib/mockData";
import type { IntroFormData } from "@/lib/types";

export default function IntroPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const { project, setProject, setIntroData } = useBuilderStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // In production: fetch project from tRPC
    // For demo: load a fresh project in "intro" stage
    if (!project || project.id !== projectId) {
      setProject({
        ...MOCK_PROJECT,
        id: projectId ?? MOCK_PROJECT.id,
        stage: "intro",
        modules: [], // no modules yet — they get generated after intro
      });
    }
  }, [projectId, project, setProject]);

  const handleSubmit = async (data: IntroFormData) => {
    setIsSubmitting(true);
    setIntroData(data);

    // In production: POST to /api/ai/intro with the form data
    // The AI returns a SeedLayout (module stubs) within 15 seconds
    // For demo: simulate AI generation delay, then seed demo modules
    await new Promise((r) => setTimeout(r, 2500));

    // Seed the project with AI-generated module stubs (demo data)
    setProject({
      ...project!,
      stage: "edit",
      modules: [
        {
          id: "mod_1",
          projectId: projectId,
          type: "RICH_TEXT",
          title: "Welcome & Overview",
          position: 0,
          content: {
            type: "RICH_TEXT",
            html: "<h2>Welcome to the team! 🎉</h2><p>This onboarding will walk you through our frontend stack, coding standards, and first-week checklist. By the end, you'll be ready to pick up your first ticket.</p>",
          },
        },
        {
          id: "mod_2",
          projectId: projectId,
          type: "INTERACTIVE_VISUAL",
          title: "System Architecture",
          position: 1,
          content: {
            type: "INTERACTIVE_VISUAL",
            visualType: "flowchart",
            mermaidDefinition: "flowchart TD\n    A[Browser] -->|tRPC| B[Next.js API]\n    B -->|Prisma| C[(PostgreSQL)]\n    C -->|Result| B\n    B -->|JSON| A",
            annotations: [],
          },
        },
        {
          id: "mod_3",
          projectId: projectId,
          type: "CODE_EDITOR",
          title: "Your First Exercise",
          position: 2,
          content: {
            type: "CODE_EDITOR",
            language: "typescript",
            starterCode: "// Write your first component\nfunction Hello() {\n  return <div>Hello, new team member!</div>;\n}\n",
          },
        },
      ],
    });

    // Navigate to the edit workspace
    router.push(`/builder/${projectId}/edit`);
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center text-text-secondary text-body">
        Loading project...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Subtle top bar */}
      <div className="h-12 bg-bg-surface border-b border-border flex items-center px-6">
        <span className="text-xs text-text-secondary font-medium tracking-wide uppercase">
          Step 2 of 3 — Project Setup
        </span>
        <span className="ml-auto text-xs text-text-disabled">
          {project.title}
        </span>
      </div>

      {/* Scrollable form area */}
      <div className="px-6 py-12 overflow-y-auto" style={{ maxHeight: "calc(100vh - 48px)" }}>
        <IntroQuestionnaire
          projectTitle={project.title}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
