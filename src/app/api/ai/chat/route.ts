import { xai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export const maxDuration = 30;

const ProposedChangeSchema = z.object({
  type: z.enum(["add_module", "update_module", "delete_module", "update_project_meta"]),
  description: z.string(),
  payload: z.record(z.unknown()),
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

interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Builds the system prompt for the AI assistant based on intro questionnaire
 * data and the current project state. The prompt instructs the AI to act as
 * an Adaptive Learning Architect that proposes structured module changes.
 *
 * @param intro - Intro questionnaire data (goals, skills, rules, examples)
 * @param project - Current project snapshot (title, description, modules)
 * @returns The assembled system prompt string
 */
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

You MUST respond with a structured JSON object representing a proposed change. The object must have:
- "type": one of "add_module", "update_module", "delete_module", "update_project_meta"
- "description": a human-readable summary of the change
- "payload": an object with the module data

Module types you can create:
- RICH_TEXT: { type: "RICH_TEXT", title: "...", content: { type: "RICH_TEXT", html: "..." } }
- INTERACTIVE_VISUAL: { type: "INTERACTIVE_VISUAL", title: "...", content: { type: "INTERACTIVE_VISUAL", visualType: "flowchart"|"sequence"|"annotated_steps", mermaidDefinition: "...", annotations: [] } }
- CODE_EDITOR: { type: "CODE_EDITOR", title: "...", content: { type: "CODE_EDITOR", language: "python"|"javascript"|"typescript", starterCode: "...", hint?: "...", solution?: "...", expectedOutput?: "..." } }

Keep descriptions concise and actionable.`;

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
    if (project.description) prompt += `\nDescription: ${project.description}`;
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
    messages: ChatMsg[];
    introContext: IntroContext | null;
    projectContext: ProjectContext | null;
  } = body;

  const systemPrompt = buildSystemPrompt(introContext, projectContext);

  const attempt = async (extraInstruction?: string) => {
    const msgs = messages.map((m) => ({ role: m.role, content: m.content }));
    if (extraInstruction) {
      const last = msgs[msgs.length - 1];
      if (last) {
        msgs[msgs.length - 1] = {
          ...last,
          content: `${last.content}\n\n${extraInstruction}`,
        };
      }
    }

    return generateObject({
      model: xai("grok-3-mini"),
      system: systemPrompt,
      messages: msgs,
      schema: ProposedChangeSchema,
      schemaName: "ProposedChange",
    });
  };

  try {
    let result;
    try {
      result = await attempt();
    } catch {
      // Retry once with an amended prompt if validation fails
      result = await attempt(
        "IMPORTANT: You must respond with valid JSON matching the ProposedChange schema exactly. Include type, description, and payload fields."
      );
    }

    return NextResponse.json({ object: result.object });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI service unavailable";
    const status =
      err && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode: number }).statusCode
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
