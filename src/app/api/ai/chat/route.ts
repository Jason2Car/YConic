import { xai } from "@ai-sdk/xai";
import { streamText, type CoreMessage } from "ai";

export const maxDuration = 30;

interface IntroContext {
  goals: string;
  baselineSkills: string[];
  customSkills: string;
  rules: string;
  examples: Array<{ type: string; label: string; value: string }>;
}

interface ProjectContext {
  title: string;
  description: string;
  modules: Array<{
    id: string;
    type: string;
    title: string;
    position: number;
  }>;
}

function buildSystemPrompt(
  intro: IntroContext | null,
  project: ProjectContext | null
): string {
  let prompt = `You are an AI assistant helping a designer build an interactive onboarding project for new team members. You help add, modify, and restructure learning modules.

You operate as an **Adaptive Learning Architect** following these personalization principles:

PERSONALIZATION RULES:
- Every module should be tailored to the learner's background and goals from the intro questionnaire
- Use the Adaptation Matrix: proficient topics get fast-tracked (recap only), partial knowledge gets standard depth, unknown topics get foundational depth with supplementals
- Calibrate depth: "foundational" = first principles + analogies; "standard" = concise with working vocabulary; "advanced" = edge cases + design trade-offs
- Always start with a Welcome & Overview module
- Group related concepts into 5-7 modules max
- Include at least one interactive visual if goals mention processes, flows, or structures
- Include at least one code exercise if goals mention technical skills
- Swap code language to match the learner's preference when specified
- Align explanation style: conceptual-first learners get theory then examples; example-first learners get scenarios then principles
- Supplemental modules are RICH_TEXT or INTERACTIVE_VISUAL only, ≤ 500 words, ending with a bridge sentence
- The final module should serve as a competency checkpoint

You can propose changes to the project by responding with structured JSON when the user asks you to add or modify modules. For normal conversation, just respond in plain text.

When proposing a module change, include a JSON block in your response wrapped in \`\`\`json ... \`\`\` with this structure:
{
  "type": "add_module" | "update_module" | "delete_module",
  "description": "Human-readable summary of the change",
  "payload": { ... module data ... }
}

Module types you can create:
- RICH_TEXT: { type: "RICH_TEXT", title: "...", content: { type: "RICH_TEXT", html: "..." } }
- INTERACTIVE_VISUAL: { type: "INTERACTIVE_VISUAL", title: "...", content: { type: "INTERACTIVE_VISUAL", visualType: "flowchart"|"sequence"|"annotated_steps", mermaidDefinition: "...", annotations: [] } }
- CODE_EDITOR: { type: "CODE_EDITOR", title: "...", content: { type: "CODE_EDITOR", language: "python"|"javascript"|"typescript", starterCode: "...", hint?: "...", solution?: "...", expectedOutput?: "..." } }

Keep responses concise and actionable. When proposing changes, explain what you're doing in 1-2 sentences before the JSON block.`;

  if (intro) {
    prompt += `\n\n--- ONBOARDING PROJECT CONTEXT ---`;
    prompt += `\nThe designer filled out an intake questionnaire. Use this to tailor all content you generate:\n`;
    if (intro.goals) prompt += `\nLEARNING GOALS:\n${intro.goals}`;
    if (intro.baselineSkills.length > 0) prompt += `\n\nBASELINE SKILLS:\n- ${intro.baselineSkills.join("\n- ")}`;
    if (intro.customSkills) prompt += `\n\nADDITIONAL SKILL NOTES:\n${intro.customSkills}`;
    if (intro.rules) prompt += `\n\nRULES & STYLE GUIDE:\n${intro.rules}`;
    if (intro.examples.length > 0) {
      prompt += `\n\nREFERENCE MATERIALS:`;
      for (const ex of intro.examples) prompt += `\n- [${ex.type.toUpperCase()}] ${ex.label}: ${ex.value}`;
    }
    prompt += `\n--- END CONTEXT ---`;
  }

  if (project) {
    prompt += `\n\nCURRENT PROJECT: "${project.title}"`;
    if (project.description) prompt += `\nDescription: ${project.description}`;
    if (project.modules.length > 0) {
      prompt += `\nExisting modules (${project.modules.length}):`;
      for (const m of project.modules) prompt += `\n  ${m.position + 1}. [${m.type}] "${m.title}" (id: ${m.id})`;
    } else {
      prompt += `\nNo modules yet.`;
    }
  }

  return prompt;
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    messages,
    introContext,
    projectContext,
  }: {
    messages: CoreMessage[];
    introContext: IntroContext | null;
    projectContext: ProjectContext | null;
  } = body;

  const systemPrompt = buildSystemPrompt(introContext, projectContext);

  try {
    const result = await streamText({
      model: xai("grok-4"),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI service unavailable";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
