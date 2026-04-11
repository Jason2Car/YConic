"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IntroQuestionnaire } from "@/components/intro/IntroQuestionnaire";
import { useBuilderStore } from "@/lib/store";
import { MOCK_PROJECT } from "@/lib/mockData";
import type { IntroFormData, Module } from "@/lib/types";

export default function IntroPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const { project, setProject, setIntroData } = useBuilderStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!project || project.id !== projectId) {
      setProject({
        ...MOCK_PROJECT,
        id: projectId ?? MOCK_PROJECT.id,
        stage: "intro",
        modules: [],
      });
    }
  }, [projectId, project, setProject]);

  const handleSubmit = async (data: IntroFormData) => {
    setIsSubmitting(true);
    setIntroData(data);
    setStatus("Generating your onboarding modules with AI...");

    try {
      // Build a prompt using personalization rules from sweet-kepler
      const seedPrompt = `You are generating the initial module layout for an onboarding project. Follow the Adaptive Learning Architect approach:

PHASE 1 — ANALYZE the questionnaire:
GOALS: ${data.goals || "General onboarding"}
BASELINE SKILLS: ${data.baselineSkills?.join(", ") || "None specified"}
ADDITIONAL NOTES: ${data.customSkills || "None"}
RULES/STYLE GUIDE: ${data.rules || "None"}
REFERENCES: ${data.examples?.map((e) => `${e.label}: ${e.value}`).join(", ") || "None"}

PHASE 2 — GAP ANALYSIS: Identify which topics need foundational coverage vs standard vs advanced based on the baseline skills.

PHASE 3 — PATH CONSTRUCTION: Create 3-5 modules in a logical learning sequence. Rules:
- Start with a Welcome & Overview (RICH_TEXT) that sets context and expectations
- Include at least one INTERACTIVE_VISUAL if goals mention processes, workflows, or architecture
- Include at least one CODE_EDITOR if goals mention technical/coding skills
- Calibrate depth: foundational for unknown topics, standard for partial knowledge, advanced for proficient areas
- End with a competency checkpoint module
- Keep module titles concise (≤ 6 words)

PHASE 4 — GENERATE: For each module, output a complete JSON block with full content. Make content substantial and tailored to the stated goals.

Generate all modules now as separate JSON blocks.`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: seedPrompt }],
          introContext: {
            goals: data.goals || "",
            baselineSkills: data.baselineSkills || [],
            customSkills: data.customSkills || "",
            rules: data.rules || "",
            examples: data.examples || [],
          },
          projectContext: {
            title: project?.title || "Onboarding Project",
            description: project?.description || "",
            modules: [],
          },
        }),
      });

      let modules: Module[] = [];

      if (response.ok) {
        const text = await response.text();
        // Try to extract JSON blocks from the AI response
        const jsonBlocks = text.match(/```json\s*([\s\S]*?)```/g);
        if (jsonBlocks) {
          let position = 0;
          for (const block of jsonBlocks) {
            try {
              const json = block.replace(/```json\s*/, "").replace(/```/, "").trim();
              const parsed = JSON.parse(json);
              if (parsed.type === "add_module" && parsed.payload) {
                const mod: Module = {
                  id: `mod_${Date.now()}_${position}`,
                  projectId,
                  type: parsed.payload.type || "RICH_TEXT",
                  title: parsed.payload.title || `Module ${position + 1}`,
                  position,
                  content: parsed.payload.content || { type: "RICH_TEXT", html: "<p>Content pending</p>" },
                };
                modules.push(mod);
                position++;
              }
            } catch {
              // Skip unparseable blocks
            }
          }
        }
      }

      // Fallback: if AI didn't return valid modules, use smart defaults based on the form
      if (modules.length === 0) {
        setStatus("Creating default modules...");
        modules = [
          {
            id: `mod_${Date.now()}_0`,
            projectId,
            type: "RICH_TEXT",
            title: "Welcome & Overview",
            position: 0,
            content: {
              type: "RICH_TEXT",
              html: `<h2>Welcome to the team! 🎉</h2><p>${data.goals || "This onboarding will guide you through everything you need to know."}</p><h3>What You'll Learn</h3><p>This project covers the key skills and knowledge you need to get started. Work through each module at your own pace.</p>`,
            },
          },
          {
            id: `mod_${Date.now()}_1`,
            projectId,
            type: "INTERACTIVE_VISUAL",
            title: "Process Overview",
            position: 1,
            content: {
              type: "INTERACTIVE_VISUAL",
              visualType: "flowchart" as const,
              mermaidDefinition: "flowchart TD\n    A([🚀 Start]) --> B[Learn the Basics]\n    B --> C[Hands-on Practice]\n    C --> D{Ready?}\n    D -->|Yes| E([✅ Complete])\n    D -->|No| B\n    style A fill:#007acc,color:#fff\n    style E fill:#28a745,color:#fff",
              annotations: [],
            },
          },
          {
            id: `mod_${Date.now()}_2`,
            projectId,
            type: "CODE_EDITOR",
            title: "Your First Exercise",
            position: 2,
            content: {
              type: "CODE_EDITOR",
              language: "typescript" as const,
              starterCode: "// Welcome! Complete this exercise to get started.\n\nfunction greet(name: string): string {\n  // TODO: Return a greeting message\n  return '';\n}\n\nconsole.log(greet('New Team Member'));\n",
              hint: "Use template literals: `Hello, ${name}!`",
              solution: "function greet(name: string): string {\n  return `Hello, ${name}! Welcome to the team!`;\n}\n\nconsole.log(greet('New Team Member'));",
            },
          },
        ];
      }

      setProject({
        ...project!,
        stage: "edit",
        modules,
      });

      router.push(`/builder/${projectId}/edit`);
    } catch (err) {
      console.error("Failed to generate modules:", err);
      setStatus("Something went wrong. Using default modules...");
      // Fallback to basic modules
      setProject({
        ...project!,
        stage: "edit",
        modules: [
          {
            id: `mod_${Date.now()}_0`,
            projectId,
            type: "RICH_TEXT",
            title: "Welcome & Overview",
            position: 0,
            content: { type: "RICH_TEXT", html: "<h2>Welcome!</h2><p>Start building your onboarding content using the AI chat.</p>" },
          },
        ],
      });
      router.push(`/builder/${projectId}/edit`);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1e1e1e", color: "#858585" }}>
        Loading project...
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1e1e1e" }}>
      <div className="h-12 flex items-center px-6" style={{ backgroundColor: "#252526", borderBottom: "1px solid #3e3e42" }}>
        <span className="text-xs font-medium tracking-wide uppercase" style={{ color: "#858585" }}>
          Step 2 of 3 — Project Setup
        </span>
        <span className="ml-auto text-xs" style={{ color: "#555" }}>{project.title}</span>
      </div>

      <div className="px-6 py-12 overflow-y-auto" style={{ maxHeight: "calc(100vh - 48px)" }}>
        {isSubmitting ? (
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="text-4xl mb-4 animate-pulse">🤖</div>
            <p className="text-sm font-medium mb-2" style={{ color: "#cccccc" }}>{status}</p>
            <p className="text-xs" style={{ color: "#858585" }}>This may take a few seconds...</p>
            <div className="mt-6 w-48 h-1.5 rounded-full mx-auto overflow-hidden" style={{ backgroundColor: "#3e3e42" }}>
              <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: "#007acc", width: "60%" }} />
            </div>
          </div>
        ) : (
          <IntroQuestionnaire
            projectTitle={project.title}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
