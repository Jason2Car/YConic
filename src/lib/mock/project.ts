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
    modules: Module[];
    createdAt: string;
    updatedAt: string;
}

export const MOCK_PROJECT: Project = {
    id: "mock-project-id",
    title: "Engineering Team Onboarding",
    description: "A comprehensive onboarding guide for new engineering team members",
    slug: null,
    published: false,
    stage: "edit",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [
        {
            id: "module-1",
            projectId: "mock-project-id",
            type: "RICH_TEXT",
            title: "Welcome to the Team",
            position: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content: {
                type: "RICH_TEXT",
                html: `<h1>Welcome to the Engineering Team! 🎉</h1>
<p>We're thrilled to have you join us. This guide will walk you through everything you need to know to get started and become a productive member of our team.</p>
<h2>What You'll Learn</h2>
<ul>
  <li>Our development workflow and processes</li>
  <li>How to set up your local development environment</li>
  <li>Key tools and technologies we use</li>
  <li>Team communication norms and expectations</li>
</ul>
<h2>Our Values</h2>
<p>We believe in <strong>collaboration over competition</strong>, <strong>quality over speed</strong>, and <strong>continuous learning</strong>. Don't hesitate to ask questions — we all started somewhere!</p>
<p>Feel free to reach out to your onboarding buddy or any team member if you need help. We're all here to support each other.</p>`,
            },
        },
        {
            id: "module-2",
            projectId: "mock-project-id",
            type: "INTERACTIVE_VISUAL",
            title: "Our Development Workflow",
            position: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content: {
                type: "INTERACTIVE_VISUAL",
                visualType: "flowchart",
                mermaidDefinition: `flowchart TD
    A([🚀 Start Feature]) --> B[Create Feature Branch]
    B --> C[Write Code & Tests]
    C --> D{Tests Pass?}
    D -->|No| C
    D -->|Yes| E[Open Pull Request]
    E --> F[Code Review]
    F --> G{Approved?}
    G -->|Changes Requested| C
    G -->|Approved| H[Merge to Main]
    H --> I[Auto Deploy to Staging]
    I --> J{QA Sign-off?}
    J -->|Issues Found| K[Fix Issues]
    K --> E
    J -->|Approved| L([✅ Deploy to Production])

    style A fill:#007acc,color:#fff
    style L fill:#28a745,color:#fff
    style D fill:#2d2d30,color:#ccc
    style G fill:#2d2d30,color:#ccc
    style J fill:#2d2d30,color:#ccc`,
                annotations: [
                    {
                        nodeId: "B",
                        label: "Feature Branch",
                        detail: "Always branch from main. Use format: feature/TICKET-description",
                    },
                    {
                        nodeId: "E",
                        label: "Pull Request",
                        detail: "PRs require at least 2 approvals. Include a description and link to the ticket.",
                    },
                    {
                        nodeId: "I",
                        label: "Staging Deploy",
                        detail: "Merges to main auto-deploy to staging via GitHub Actions within ~5 minutes.",
                    },
                ],
            },
        },
        {
            id: "module-3",
            projectId: "mock-project-id",
            type: "CODE_EDITOR",
            title: "Codebase Setup",
            position: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content: {
                type: "CODE_EDITOR",
                language: "typescript",
                starterCode: `// Welcome to the codebase! Let's verify your setup.
// Run this script to check your environment is configured correctly.

import { execSync } from "child_process";

interface EnvCheck {
  name: string;
  command: string;
  expectedPattern: RegExp;
}

const checks: EnvCheck[] = [
  {
    name: "Node.js version",
    command: "node --version",
    expectedPattern: /v(18|20|22)\\.\\d+\\.\\d+/,
  },
  {
    name: "npm version",
    command: "npm --version",
    expectedPattern: /\\d+\\.\\d+\\.\\d+/,
  },
  {
    name: "Git version",
    command: "git --version",
    expectedPattern: /git version \\d+/,
  },
];

function runChecks(checks: EnvCheck[]): void {
  console.log("🔍 Checking your development environment...\\n");

  for (const check of checks) {
    try {
      const output = execSync(check.command, { encoding: "utf-8" }).trim();
      const passed = check.expectedPattern.test(output);
      const status = passed ? "✅" : "⚠️";
      console.log(\`\${status} \${check.name}: \${output}\`);
    } catch {
      console.log(\`❌ \${check.name}: Not found\`);
    }
  }

  console.log("\\n✨ Environment check complete!");
}

runChecks(checks);`,
                hint: "Make sure you have Node.js 18+ installed. Run `node --version` in your terminal to check.",
                solution: `// All checks should pass with Node.js 18+, npm 9+, and Git 2+
// If any check fails, install the missing tool and re-run.
import { execSync } from "child_process";

const output = execSync("node --version", { encoding: "utf-8" }).trim();
console.log("Node.js version:", output);`,
                expectedOutput: "🔍 Checking your development environment...",
            },
        },
        {
            id: "module-4",
            projectId: "mock-project-id",
            type: "INTERACTIVE_VISUAL",
            title: "Key Processes",
            position: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content: {
                type: "INTERACTIVE_VISUAL",
                visualType: "sequence",
                mermaidDefinition: `sequenceDiagram
    participant Dev as 👩‍💻 Developer
    participant GH as 🐙 GitHub
    participant CI as ⚙️ CI/CD
    participant Rev as 👥 Reviewer
    participant Prod as 🚀 Production

    Dev->>GH: Push feature branch
    GH->>CI: Trigger CI pipeline
    CI->>CI: Run tests & linting
    CI-->>Dev: ✅ Tests passed
    Dev->>GH: Open Pull Request
    GH->>Rev: Request review notification
    Rev->>GH: Review & approve
    GH->>CI: Trigger merge pipeline
    CI->>Prod: Deploy to staging
    CI-->>Dev: 🎉 Deployed to staging
    Dev->>Rev: QA sign-off request
    Rev-->>Dev: ✅ Approved for production
    Dev->>GH: Merge to main
    GH->>CI: Trigger production deploy
    CI->>Prod: Deploy to production
    Prod-->>Dev: 🚀 Live in production!`,
                annotations: [
                    {
                        nodeId: "CI",
                        label: "CI/CD Pipeline",
                        detail: "We use GitHub Actions. Pipeline runs: TypeScript check, ESLint, Jest tests, and build verification.",
                    },
                    {
                        nodeId: "Rev",
                        label: "Code Review",
                        detail: "Reviews should be completed within 24 hours. Use the PR template and link to the Jira ticket.",
                    },
                ],
            },
        },
    ],
};

export function getMockProject(projectId: string): Project {
    return { ...MOCK_PROJECT, id: projectId };
}
