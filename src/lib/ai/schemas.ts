import { z } from "zod";

export const ModuleContentSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("RICH_TEXT"),
        html: z.string().describe("HTML content for the rich text module"),
    }),
    z.object({
        type: z.literal("INTERACTIVE_VISUAL"),
        visualType: z.enum(["flowchart", "sequence", "annotated_steps"]),
        mermaidDefinition: z.string().describe("Valid Mermaid.js diagram syntax"),
        annotations: z.array(
            z.object({
                nodeId: z.string(),
                label: z.string(),
                detail: z.string(),
            })
        ),
    }),
    z.object({
        type: z.literal("CODE_EDITOR"),
        language: z.enum(["python", "javascript", "typescript"]),
        starterCode: z.string(),
        solution: z.string().optional(),
        hint: z.string().optional(),
        expectedOutput: z.string().optional(),
    }),
]);

export const ProposedChangeSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("add_module"),
        description: z.string().describe("Human-readable summary of the change"),
        payload: z.object({
            moduleType: z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"]),
            title: z.string(),
            content: ModuleContentSchema,
        }),
    }),
    z.object({
        type: z.literal("update_module"),
        description: z.string().describe("Human-readable summary of the change"),
        payload: z.object({
            moduleId: z.string().describe("ID of the module to update"),
            title: z.string().optional(),
            content: ModuleContentSchema.optional(),
        }),
    }),
    z.object({
        type: z.literal("delete_module"),
        description: z.string().describe("Human-readable summary of the change"),
        payload: z.object({
            moduleId: z.string().describe("ID of the module to delete"),
        }),
    }),
]);

export type ProposedChangeData = z.infer<typeof ProposedChangeSchema>;
