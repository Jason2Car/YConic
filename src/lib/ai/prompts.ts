import type { Module } from "@/lib/types";

export function buildSystemPrompt(modules: Module[]): string {
  const moduleList = modules
    .sort((a, b) => a.position - b.position)
    .map((m) => {
      let info = "";
      switch (m.type) {
        case "RICH_TEXT": info = "Rich text"; break;
        case "INTERACTIVE_VISUAL": info = `${(m.content as { visualType: string }).visualType} diagram`; break;
        case "CODE_EDITOR": info = `${(m.content as { language: string }).language} code`; break;
      }
      return `  ID="${m.id}" | "${m.title}" | ${m.type} | ${info}`;
    })
    .join("\n");

  return `You build employee onboarding modules. Return ONE structured JSON change.

MODULES:
${moduleList || "  (none)"}

STEP 1 — DECIDE contentType based on what the user asked for:

  "RICH_TEXT" → user wants: text, explanation, guide, documentation, welcome message, policy, FAQ, overview, description, information, list, instructions
  
  "CODE_EDITOR" → user wants: code exercise, coding challenge, programming task, script, function to write, coding tutorial, code example
  
  "INTERACTIVE_VISUAL" → user wants: diagram, flowchart, process flow, sequence diagram, visual, workflow chart, architecture diagram

STEP 2 — FILL ONLY the fields for your chosen contentType:

  If RICH_TEXT → fill "html" with rich HTML (h1, h2, p, ul, li, strong, em). 3+ paragraphs minimum.
  
  If CODE_EDITOR → fill "language" (python/javascript/typescript), "starterCode" (10+ lines with TODO comments), optionally "hint", "solution", "expectedOutput".
  
  If INTERACTIVE_VISUAL → fill "visualType" (flowchart/sequence/annotated_steps), "mermaidDefinition" (valid Mermaid.js), optionally "annotations".

DO NOT mix fields from different types. If contentType is RICH_TEXT, do NOT fill starterCode or mermaidDefinition. If contentType is CODE_EDITOR, do NOT fill html or mermaidDefinition.

For add_module: also set moduleType to match contentType.
For update_module: use exact moduleId from the list. Provide complete replacement content.
For delete_module: just provide moduleId.`;
}
