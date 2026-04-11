import { z } from "zod";

export const ProposedChangeSchema = z.object({
  type: z.enum(["add_module", "update_module", "delete_module", "update_project_meta"]),
  description: z.string(),
  payload: z.object({
    moduleId: z.string().optional(),
    type: z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"]).optional(),
    title: z.string().optional(),
    position: z.number().optional(),
    content: z.any().optional(),
    projectTitle: z.string().optional(),
    projectDescription: z.string().optional(),
  }),
});

export type ProposedChange = z.infer<typeof ProposedChangeSchema>;
