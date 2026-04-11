// ─── Module Content Types ────────────────────────────────────────────────────

export type ModuleType = "RICH_TEXT" | "INTERACTIVE_VISUAL" | "CODE_EDITOR";

export interface RichTextContent {
  type: "RICH_TEXT";
  html: string;
}

export interface InteractiveVisualContent {
  type: "INTERACTIVE_VISUAL";
  visualType: "flowchart" | "sequence" | "annotated_steps";
  mermaidDefinition: string;
  annotations: Annotation[];
}

export interface Annotation {
  nodeId: string;
  label: string;
  detail: string;
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

// ─── Module ──────────────────────────────────────────────────────────────────

export interface Module {
  id: string;
  projectId: string;
  type: ModuleType;
  title: string;
  position: number;
  content: ModuleContent | null;
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type ProjectStage = "init" | "intro" | "edit";

export interface Project {
  id: string;
  title: string;
  description: string;
  slug?: string;
  published: boolean;
  stage: ProjectStage;
  modules: Module[];
}

// ─── AI / Session ────────────────────────────────────────────────────────────

export type ProposedChangeType =
  | "add_module"
  | "update_module"
  | "delete_module"
  | "update_project_meta";

export interface ProposedChange {
  type: ProposedChangeType;
  description: string;
  payload: unknown;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposedChange?: ProposedChange;
  status?: "pending" | "approved" | "rejected";
}

export interface RevisionEntry {
  timestamp: string;
  changeDescription: string;
  snapshotBefore: Project;
}

// ─── Intro Questionnaire ─────────────────────────────────────────────────────

export interface IntroFormData {
  goals: string;
  baselineSkills: string[];
  customSkills: string;
  rules: string;
  examples: ExampleReference[];
}

export interface ExampleReference {
  id: string;
  type: "url" | "text";
  label: string;
  value: string;
}
