import type { Project } from "./types";

export const MOCK_PROJECT: Project = {
  id: "proj_demo",
  title: "Web Dev Onboarding",
  description: "Get new members up to speed on our frontend stack.",
  published: false,
  stage: "intro", // first-time visitors start here
  modules: [
    {
      id: "mod_1",
      projectId: "proj_demo",
      type: "RICH_TEXT",
      title: "Welcome & Overview",
      position: 0,
      content: {
        type: "RICH_TEXT",
        html: "<h2>Welcome to the team! 🎉</h2><p>This onboarding will walk you through our frontend stack, coding standards, and first-week checklist. By the end, you'll be ready to pick up your first ticket.</p><ul><li>React + TypeScript</li><li>Tailwind CSS</li><li>tRPC for API calls</li><li>Prisma + PostgreSQL</li></ul>",
      },
    },
    {
      id: "mod_2",
      projectId: "proj_demo",
      type: "INTERACTIVE_VISUAL",
      title: "Request Lifecycle",
      position: 1,
      content: {
        type: "INTERACTIVE_VISUAL",
        visualType: "flowchart",
        mermaidDefinition: `flowchart TD
    A[Browser] -->|tRPC call| B[Next.js API Route]
    B -->|Prisma query| C[(PostgreSQL)]
    C -->|Result| B
    B -->|JSON response| A
    B -->|AI request| D[OpenAI GPT-4o]
    D -->|Streamed response| B`,
        annotations: [
          { nodeId: "A", label: "Browser", detail: "React client using tRPC hooks" },
          { nodeId: "B", label: "API Route", detail: "Next.js App Router route handler" },
          { nodeId: "C", label: "Database", detail: "PostgreSQL via Prisma ORM" },
          { nodeId: "D", label: "OpenAI", detail: "GPT-4o for AI-assisted content generation" },
        ],
      },
    },
    {
      id: "mod_3",
      projectId: "proj_demo",
      type: "CODE_EDITOR",
      title: "Your First tRPC Call",
      position: 2,
      content: {
        type: "CODE_EDITOR",
        language: "typescript",
        starterCode: `// Use the tRPC client to fetch the project list
import { trpc } from "@/lib/trpc";

function ProjectList() {
  // TODO: call trpc.project.list.useQuery()
  // and render the project titles
  
  return <div>Projects go here</div>;
}`,
        hint: "Use the useQuery hook: const { data } = trpc.project.list.useQuery()",
        solution: `import { trpc } from "@/lib/trpc";

function ProjectList() {
  const { data: projects, isLoading } = trpc.project.list.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {projects?.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  );
}`,
        expectedOutput: "Renders a list of project titles",
      },
    },
  ],
};
