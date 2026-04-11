import { xai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/ai/prompts";

export const maxDuration = 30;

const ChangeSchema = z.object({
    changeType: z.enum(["add_module", "update_module", "delete_module"])
        .describe("add_module = create new, update_module = edit existing, delete_module = remove"),
    description: z.string()
        .describe("Human-readable summary of the change"),
    moduleId: z.string().optional()
        .describe("For update/delete: exact module ID like 'module-1'"),
    title: z.string().optional()
        .describe("Module title"),
    contentType: z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"])
        .describe("Determines which content fields to use. RICH_TEXT for text/docs, CODE_EDITOR for code exercises, INTERACTIVE_VISUAL for diagrams."),
    // RICH_TEXT
    html: z.string().optional()
        .describe("HTML content for RICH_TEXT modules. Use h1, h2, p, ul, li, strong, em."),
    // CODE_EDITOR
    language: z.enum(["python", "javascript", "typescript"]).optional()
        .describe("Programming language for CODE_EDITOR modules."),
    starterCode: z.string().optional()
        .describe("Starter code for CODE_EDITOR modules."),
    hint: z.string().optional()
        .describe("Hint for CODE_EDITOR modules."),
    solution: z.string().optional()
        .describe("Solution for CODE_EDITOR modules."),
    expectedOutput: z.string().optional()
        .describe("Expected output for CODE_EDITOR modules."),
    // INTERACTIVE_VISUAL
    visualType: z.enum(["flowchart", "sequence", "annotated_steps"]).optional()
        .describe("Diagram type for INTERACTIVE_VISUAL modules."),
    mermaidDefinition: z.string().optional()
        .describe("Mermaid.js syntax for INTERACTIVE_VISUAL modules."),
    annotations: z.array(z.object({
        nodeId: z.string(),
        label: z.string(),
        detail: z.string(),
    })).optional()
        .describe("Hover annotations for INTERACTIVE_VISUAL modules."),
});

export type FlatChange = z.infer<typeof ChangeSchema>;

// Post-process: strip fields that don't belong to the chosen contentType
function cleanResponse(obj: FlatChange): FlatChange {
    const cleaned = {
        changeType: obj.changeType,
        description: obj.description,
        moduleId: obj.moduleId,
        title: obj.title,
        contentType: obj.contentType,
    } as FlatChange;

    switch (obj.contentType) {
        case "RICH_TEXT":
            cleaned.html = obj.html;
            break;
        case "CODE_EDITOR":
            cleaned.language = obj.language;
            cleaned.starterCode = obj.starterCode;
            cleaned.hint = obj.hint;
            cleaned.solution = obj.solution;
            cleaned.expectedOutput = obj.expectedOutput;
            break;
        case "INTERACTIVE_VISUAL":
            cleaned.visualType = obj.visualType;
            cleaned.mermaidDefinition = obj.mermaidDefinition;
            cleaned.annotations = obj.annotations;
            break;
    }

    return cleaned;
}

export async function POST(req: Request) {
    try {
        const { messages, modules, forceType } = await req.json();
        let systemPrompt = buildSystemPrompt(modules ?? []);

        // If a @command forced a type, override the prompt
        if (forceType && ["RICH_TEXT", "CODE_EDITOR", "INTERACTIVE_VISUAL"].includes(forceType)) {
            systemPrompt += `\n\nCRITICAL OVERRIDE: The user explicitly requested contentType="${forceType}". You MUST set contentType to "${forceType}" and ONLY fill fields for that type. No exceptions.`;
        }

        const { object } = await generateObject({
            model: xai("grok-4"),
            schema: ChangeSchema,
            system: systemPrompt,
            messages: messages.map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
        });

        const cleaned = cleanResponse(object);
        console.log("[API] contentType:", cleaned.contentType, "changeType:", cleaned.changeType);
        return Response.json(cleaned);
    } catch (error) {
        console.error("AI chat error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json(
            { error: "AI assistant temporarily unavailable.", details: message },
            { status: 500 }
        );
    }
}
