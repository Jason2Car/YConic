import { xai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export const maxDuration = 30;

// ─── Input validation schemas ────────────────────────────────────────────────

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(10000, "Message too long (max 10,000 chars)"),
});

const IntroContextSchema = z.object({
  goals: z.string().max(5000).default(""),
  baselineSkills: z.array(z.string().max(200)).max(50).default([]),
  customSkills: z.string().max(2000).default(""),
  rules: z.string().max(2000).default(""),
  examples: z.array(z.object({
    type: z.string().max(50),
    label: z.string().max(200),
    value: z.string().max(2000),
  })).max(20).default([]),
}).nullable();

const ProjectContextSchema = z.object({
  title: z.string().max(200).default(""),
  description: z.string().max(2000).default(""),
  modules: z.array(z.object({
    id: z.string().max(100),
    type: z.string().max(50),
    title: z.string().max(200),
    position: z.number().int().min(0).max(100),
  })).max(50).default([]),
}).nullable();

const RequestBodySchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
  introContext: IntroContextSchema.default(null),
  projectContext: ProjectContextSchema.default(null),
});

const ProposedChangeSchema = z.object({
  type: z.enum(["add_module", "update_module", "delete_module", "update_project_meta"]),
  description: z.string(),
  payload: z.record(z.unknown()),
});

// Types inferred from Zod schemas
type IntroContext = z.infer<typeof IntroContextSchema>;
type ProjectContext = z.infer<typeof ProjectContextSchema>;

/**
 * Builds the system prompt for the AI assistant.
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
  // Validate request body
  let body;
  try {
    const raw = await req.json();
    body = RequestBodySchema.parse(raw);
  } catch (err) {
    const message = err instanceof z.ZodError ? err.errors.map((e) => e.message).join(", ") : "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { messages, introContext, projectContext } = body;
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
