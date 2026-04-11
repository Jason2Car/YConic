import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";

export const maxDuration = 30;

// OpenRouter is OpenAI-compatible — just point at their base URL
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

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

    if (intro.goals) {
      prompt += `\nLEARNING GOALS:\n${intro.goals}`;
    }

    if (intro.baselineSkills.length > 0) {
      prompt += `\n\nBASELINE SKILLS (assumed prior knowledge):\n- ${intro.baselineSkills.join("\n- ")}`;
    }

    if (intro.customSkills) {
      prompt += `\n\nADDITIONAL SKILL NOTES:\n${intro.customSkills}`;
    }

    if (intro.rules) {
      prompt += `\n\nRULES & STYLE GUIDE:\n${intro.rules}`;
    }

    if (intro.examples.length > 0) {
      prompt += `\n\nREFERENCE MATERIALS:`;
      for (const ex of intro.examples) {
        prompt += `\n- [${ex.type.toUpperCase()}] ${ex.label}: ${ex.value}`;
      }
    }

    prompt += `\n--- END CONTEXT ---`;
  }

  if (project) {
    prompt += `\n\nCURRENT PROJECT: "${project.title}"`;
    if (project.description) {
      prompt += `\nDescription: ${project.description}`;
    }
    if (project.modules.length > 0) {
      prompt += `\nExisting modules (${project.modules.length}):`;
      for (const m of project.modules) {
        prompt += `\n  ${m.position + 1}. [${m.type}] "${m.title}" (id: ${m.id})`;
      }
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

  // Use Grok via OpenRouter — swap the model string to use any model:
  // "x-ai/grok-3-mini", "anthropic/claude-3.5-sonnet", "openai/gpt-4o", etc.
  const model = process.env.OPENROUTER_MODEL ?? "x-ai/grok-3-mini";

  try {
    const result = await streamText({
      model: openrouter(model),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "AI service unavailable";
    const status =
      err && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode: number }).statusCode
        : 500;

    return new Response(
      JSON.stringify({ error: message }),
      {
        status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
