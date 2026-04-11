/** Shared TypeScript types for the Onboarding Project Builder */

export type ModuleType = "RICH_TEXT" | "INTERACTIVE_VISUAL" | "CODE_EDITOR";

export interface RichTextContent {
    type: "RICH_TEXT";
    html: string;
}

export interface InteractiveVisualContent {
    type: "INTERACTIVE_VISUAL";
    visualType: "flowchart" | "sequence" | "annotated_steps";
    mermaidDefinition: string;
    annotations: Array<{
        nodeId: string;
        label: string;
        detail: string;
    }>;
}

export interface CodeEditorContent {
    type: "CODE_EDITOR";
    language: "python" | "javascript" | "typescript";
    starterCode: string;
    solution?: string;
    hint?: string;
    expectedOutput?: string;
}

export type ModuleContent =
    | RichTextContent
    | InteractiveVisualContent
    | CodeEditorContent;

export interface Module {
    id: string;
    projectId: string;
    type: ModuleType;
    title: string;
    position: number;
    content: ModuleContent;
    createdAt: string;
    updatedAt: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    slug: string | null;
    published: boolean;
    stage: "init" | "intro" | "edit";
    ownerId?: string | null;
    modules: Module[];
    createdAt: string;
    updatedAt: string;
}

/** Joinee progress stored in localStorage */
export interface JoineeProgress {
    projectSlug: string;
    completedModuleIds: string[];
    lastVisited: string;
}
