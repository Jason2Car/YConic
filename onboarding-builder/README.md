# Onboarding Builder

An AI-powered platform where team leads build interactive onboarding projects, and recruiters personalize them for each new hire — so every employee, regardless of starting level, reaches the same competency benchmark.

---

## Table of Contents

1. [What This Project Does](#what-this-project-does)
2. [The Three Actors](#the-three-actors)
3. [System Architecture](#system-architecture)
4. [Designer Workflow — Building a Project](#designer-workflow--building-a-project)
5. [Recruiter Workflow — Personalizing for a New Hire](#recruiter-workflow--personalizing-for-a-new-hire)
6. [Joinee Experience — Completing the Onboarding](#joinee-experience--completing-the-onboarding)
7. [Tech Stack](#tech-stack)
8. [Project Structure](#project-structure)
9. [Data Models](#data-models)
10. [API Layer — tRPC Routers](#api-layer--trpc-routers)
11. [AI Integration](#ai-integration)
12. [GitHub Repo Parser](#github-repo-parser)
13. [Authentication](#authentication)
14. [Client-Side State](#client-side-state)
15. [Module Content Types](#module-content-types)
16. [Personalization Adaptation Types](#personalization-adaptation-types)
17. [Self-Check Quizzes](#self-check-quizzes)
18. [Progress Tracking](#progress-tracking)
19. [Error Handling](#error-handling)
20. [Setup Guide](#setup-guide)
21. [Environment Variables](#environment-variables)
22. [Deployment](#deployment)
23. [Routes Reference](#routes-reference)

---

## What This Project Does

This platform has two major capabilities:

**Capability 1 — Generalized Onboarding Builder**
A Designer (team lead, org leader) creates a structured onboarding project using an AI co-development workflow. The project is composed of ordered modules — rich text explanations, interactive Mermaid diagrams, and embedded code editors. The Designer converses with an AI assistant that proposes changes (add/edit/delete modules), which the Designer approves or rejects. The finished project is published and accessible via a shareable URL.

**Capability 2 — Personalized Onboarding Engine**
A Recruiter takes a published generalized project and enrolls a specific new hire. They fill in the hire's profile (experience, skills, learning preferences), and the AI generates a personalized version of the project. Modules are adapted based on the hire's background: topics they already know are condensed into fast-track recaps with self-check quizzes, topics they lack prerequisites for get supplemental modules inserted before them, and content depth is adjusted (foundational / standard / advanced). The personalized project is delivered as a unique URL the hire can access without creating an account.

The generalized project is never modified by personalization. Each personalized project is an independent copy.

---

## The Three Actors

| Actor | What They Do | Auth Required |
|---|---|---|
| **Designer** | Creates and publishes generalized onboarding projects using the AI builder | Yes (Google OAuth) |
| **Recruiter** | Enrolls new hires against published projects, reviews AI personalization plans, approves delivery | Yes (Google OAuth) |
| **Joinee** | Accesses their personalized project via a unique URL, completes modules, takes quizzes | No (account-free) |

Any logged-in user can act as both Designer and Recruiter — there is no hard role gating. The navigation provides links to both dashboards.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│                                                                  │
│  Designer UI          Recruiter UI          Joinee UI            │
│  /dashboard           /recruiter/dashboard  /learn/[slug]        │
│  /builder/[id]/intro  /recruiter/.../profile                     │
│  /builder/[id]/edit   /recruiter/.../personalize                 │
│  /p/[slug]                                                       │
└──────────┬──────────────────┬──────────────────┬─────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 14 App (Vercel)                        │
│                                                                  │
│  tRPC Router (/api/trpc)                                         │
│    ├── project.*      — CRUD, publish                            │
│    ├── module.*       — add, update, reorder, delete             │
│    ├── session.*      — create, applyChange, undo                │
│    └── enrollment.*   — create, submitProfile, approve, getBySlug│
│                                                                  │
│  AI Routes                                                       │
│    ├── /api/ai/intro       — generates seed module layout        │
│    ├── /api/ai/chat        — streams proposed changes            │
│    └── /api/ai/personalize — generates personalization plan      │
│                                                                  │
│  Auth                                                            │
│    └── /api/auth/[...nextauth] — Google OAuth via NextAuth v5    │
└──────────┬──────────────────┬──────────────────┬─────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────┐  ┌───────────────┐  ┌──────────────────┐
│  PostgreSQL  │  │  Grok (xAI)   │  │  Piston API      │
│  (Neon)      │  │  LLM Provider │  │  Code Sandbox    │
│  via Prisma  │  │  OpenAI-compat│  │  Python/JS/TS    │
└──────────────┘  └───────────────┘  └──────────────────┘
```

---

## Designer Workflow — Building a Project

The Designer creates an onboarding project through three sequential stages:

### Stage 1 — Init

The Designer clicks "New Project" on the dashboard, enters a title and description. The system creates a `Project` record in the database with `stage: INTRO` and redirects to the Intro questionnaire.

**What happens technically:**
- `project.create` tRPC mutation fires
- A `Project` row is written with `stage: "INTRO"`, `published: false`
- The client redirects to `/builder/[projectId]/intro`

### Stage 2 — Intro (AI-Seeded Layout)

The Designer fills out a three-part questionnaire:

1. **Onboarding Goals** — free text describing what joinees should know or be able to do after completing the project
2. **Baseline Requirements** — what prior knowledge can be assumed (e.g., "basic Python", "Git fundamentals")
3. **GitHub Repository** (optional) — a repo URL. The system fetches the repo's file tree and source code, parses it, and sends it to the AI as context so the generated modules reference real files and patterns from the codebase

On submit, the answers are sent to `POST /api/ai/intro`. The AI (Grok) generates a `SeedLayout` — an ordered list of 5-7 module stubs (type + title + description) following these rules:
- Always starts with a "Welcome & Overview" rich text module
- Includes interactive visuals if goals mention processes/flows/architecture
- Includes code exercises if goals mention technical skills
- Module titles are ≤ 6 words
- Final module serves as a capstone/assessment

The stubs are written to the database as `Module` rows. The project stage advances to `EDIT`.

### Stage 3 — Edit (AI Co-Development Workspace)

The Designer enters a split-pane workspace:
- **Left panel (ChatPanel):** A conversation interface where the Designer types natural language instructions
- **Right panel (PreviewPanel):** A live preview of all modules in the project

**How the AI chat works:**

1. The Designer types an instruction (e.g., "Add a flowchart showing the deploy pipeline")
2. The instruction + current project snapshot are sent to `POST /api/ai/chat`
3. The AI returns a `ProposedChange` — a structured JSON object with `type` (add_module / update_module / delete_module / update_project_meta), a human-readable `description`, and a `payload` containing the full module content
4. The proposed change appears in an approve/reject bar at the bottom of the chat panel
5. If the Designer **approves**: the change is applied to the database via `session.applyChange`, the preview updates, and a snapshot is saved to the revision history
6. If the Designer **rejects**: the AI acknowledges and asks for clarification
7. The Designer can **undo** the most recent approved change at any time — this restores the project to the exact state before that change

**Auto-save:** Every approved change is persisted to the database immediately via the tRPC mutation.

**Publishing:** When the Designer is satisfied, they publish the project. This generates a unique slug and makes the project accessible at `/p/[slug]` without authentication.

---

## Recruiter Workflow — Personalizing for a New Hire

The Recruiter takes a published generalized project and creates a personalized version for a specific employee. This happens in three stages:

### Stage 1 — Enroll

The Recruiter opens the Recruiter Dashboard (`/recruiter/dashboard`), clicks "Add Employee", selects a published project, and enters the employee's name, email, and job title. This creates a `JoineeEnrollment` record and a `Joinee` record (or updates an existing one if the email matches).

**Precondition:** The source project must be published. Attempting to enroll against an unpublished project returns an error.

### Stage 2 — Profile

The Recruiter fills out a five-section profile form for the new hire:

1. **Identity** — name, email, job title (pre-filled from enrollment)
2. **Role Context** — which team they're joining, their day-to-day responsibilities
3. **Prior Experience** — years of relevant experience, previous roles, domains worked in
4. **Skill Assessment** — for each module in the source project, the Recruiter rates the hire's knowledge level: "No knowledge", "Partial", or "Proficient". This checklist is dynamically generated from the source project's module titles.
5. **Learning Preferences** — preferred programming language (Python/JS/TS or none), explanation style (conceptual-first vs. example-first), accessibility needs

On submit:
- The profile is saved to the `JoineeEnrollment.profile` JSONB column
- The system calls `POST /api/ai/personalize` with the profile + full source project snapshot
- The AI generates a `PersonalizationPlan` — an ordered list of `PersonalizedModuleSpec` objects

### Stage 3 — Personalize (Review & Approve)

The Recruiter sees the AI-generated plan as a list of cards, each showing:
- Module title
- Adaptation type badge (Standard / Fast Track / Supplemental / Advanced)
- Content depth badge (Foundational / Standard / Advanced)
- Module type (RICH_TEXT / INTERACTIVE_VISUAL / CODE_EDITOR)
- AI rationale (1-2 sentences explaining why this adaptation was chosen)

The Recruiter can:
- **Override** any module's adaptation type or content depth via inline dropdowns
- **Approve** the plan — this generates the `PersonalizedProject` and all `PersonalizedModule` rows, creates a unique `joineeSlug`, and shows the personalized URL for the Recruiter to copy and share
- **Regenerate** — discard the plan and resubmit with an optional note to the AI (e.g., "reduce supplemental modules", "make it more advanced")

**Coverage validation:** Before approval, the system validates that every source module is covered in the plan. If any source module is missing, approval is rejected with an error listing the uncovered modules.

**Module count cap:** The total number of personalized modules (including supplementals) cannot exceed `floor(1.5 × sourceModuleCount)`. If the AI returns more, excess supplementals are trimmed.

---

## Joinee Experience — Completing the Onboarding

The Joinee receives a URL like `/learn/abc123xyz456` and opens it in their browser. No account or login is required.

They see:
- **Left sidebar:** An ordered list of all personalized modules with completion checkmarks and adaptation badges (Fast Track, Supplemental, Advanced)
- **Progress bar:** Shows X/Y modules completed
- **Main content area:** The current module's adapted content

For each module, the Joinee:
1. Reads/interacts with the content (rich text, diagrams, or code)
2. If the module is **fast-tracked**, they must complete a self-check quiz (2-5 multiple choice questions) before proceeding
3. Clicks "Complete & Next" to mark the module done and advance

**Progress persistence:** Completed module IDs and quiz results are stored in the browser's `localStorage` under the key `opb_progress_[joineeSlug]`. Progress survives page refreshes without any server-side account.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components, built-in API routes, Vercel deployment |
| Language | TypeScript | End-to-end type safety |
| Styling | Tailwind CSS | Dark mode default, minimal custom CSS |
| API | tRPC v11 | Type-safe RPC, no code generation, shared types |
| AI | Vercel AI SDK + Grok (xAI) | OpenAI-compatible API, `generateObject` for structured JSON output |
| ORM | Prisma v7 | Type-safe DB client, schema-first migrations |
| Database | PostgreSQL (Neon) | Serverless Postgres, JSONB for flexible content |
| Auth | NextAuth.js v5 (Auth.js) | Google OAuth, JWT sessions |
| State | Zustand | Lightweight client state for builder session |
| Validation | Zod | Runtime schema validation for AI output and tRPC inputs |
| Code Execution | Piston API | Sandboxed multi-language execution (Python, JS, TS) |

---

## Project Structure

```
onboarding-builder/
├── prisma/
│   ├── schema.prisma                          # All data models and enums
│   └── migrations/                            # Auto-generated migration SQL
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx              # Google OAuth login page
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── intro/route.ts             # AI seed layout generation
│   │   │   │   ├── chat/route.ts              # AI co-development streaming
│   │   │   │   └── personalize/route.ts       # AI personalization plan generation
│   │   │   ├── auth/[...nextauth]/route.ts    # NextAuth handler
│   │   │   └── trpc/[trpc]/route.ts           # tRPC HTTP handler
│   │   ├── builder/[projectId]/
│   │   │   ├── intro/page.tsx                 # Stage 2: Intro questionnaire
│   │   │   └── edit/page.tsx                  # Stage 3: AI co-development workspace
│   │   ├── dashboard/page.tsx                 # Designer project list
│   │   ├── recruiter/
│   │   │   ├── dashboard/page.tsx             # Recruiter enrollment list
│   │   │   └── enrollments/[enrollmentId]/
│   │   │       ├── profile/page.tsx           # Joinee profile form
│   │   │       └── personalize/page.tsx       # Plan review & approve
│   │   ├── learn/[joineeSlug]/page.tsx        # Personalized joinee view
│   │   ├── layout.tsx                         # Root layout (dark mode, providers)
│   │   └── page.tsx                           # Redirects to /dashboard
│   ├── components/
│   │   └── providers.tsx                      # tRPC + React Query + NextAuth providers
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── introRules.ts                  # System prompt for seed layout generation
│   │   │   ├── prompts.ts                     # System prompt for edit-stage AI chat
│   │   │   ├── schemas.ts                     # Zod schema for ProposedChange
│   │   │   └── personalizationRules.ts        # System prompt for personalization
│   │   ├── auth.ts                            # NextAuth configuration
│   │   ├── github.ts                          # GitHub repo fetcher/parser
│   │   ├── store.ts                           # Zustand store for builder state
│   │   └── trpc.ts                            # tRPC React client
│   ├── server/
│   │   ├── db/prisma.ts                       # Prisma client singleton
│   │   └── trpc/
│   │       ├── init.ts                        # tRPC context, router, procedures
│   │       └── router/
│   │           ├── index.ts                   # Root router (merges all sub-routers)
│   │           ├── project.ts                 # Project CRUD + publish
│   │           ├── module.ts                  # Module CRUD + reorder
│   │           ├── session.ts                 # Session create + applyChange + undo
│   │           └── enrollment.ts              # Enrollment CRUD + personalization
│   └── types/
│       └── next-auth.d.ts                     # NextAuth type augmentation
├── .env                                       # Environment variables (gitignored)
├── vercel.json                                # Vercel deployment config
└── SETUP.md                                   # Step-by-step setup instructions
```

---

## Data Models

### Core Models (Designer Workflow)

**User** — Authenticated user (Designer or Recruiter). Created on first Google OAuth sign-in.
- `id`, `email`, `name`, `image`, `role` (DESIGNER | RECRUITER)

**Project** — A generalized onboarding project.
- `id`, `title`, `description`, `stage` (INIT | INTRO | EDIT), `slug` (set on publish), `published`, `ownerId`, `introData` (JSONB — goals, baseline, repoUrl)

**Module** — A single content unit within a project.
- `id`, `projectId`, `type` (RICH_TEXT | INTERACTIVE_VISUAL | CODE_EDITOR), `title`, `position` (0-indexed), `content` (JSONB)

**Session** — An active AI co-development session.
- `id`, `projectId`, `userId`, `history` (JSONB array of revision snapshots)

### Personalization Models (Recruiter Workflow)

**Joinee** — A new hire enrolled for personalized onboarding.
- `id`, `email` (unique), `name`, `jobTitle`

**JoineeEnrollment** — Links a Joinee to a source Project with a personalization lifecycle.
- `id`, `joineeId`, `sourceProjectId`, `recruiterId`, `stage` (ENROLL | PROFILE | PERSONALIZE | DELIVERED), `profile` (JSONB), `personalizationPlan` (JSONB), `joineeSlug` (unique, set on approval), `deliveredAt`

**PersonalizedProject** — A joinee-specific copy of a generalized project.
- `id`, `enrollmentId` (unique), `title`

**PersonalizedModule** — An adapted module within a personalized project.
- `id`, `personalizedProjectId`, `sourceModuleId` (null for supplementals), `type`, `title`, `position`, `adaptationType` (STANDARD | FAST_TRACK | SUPPLEMENTAL | ADVANCED), `contentDepth` (FOUNDATIONAL | STANDARD | ADVANCED), `content` (JSONB), `rationale`

### Relationships

```
User ──< Project ──< Module
                  ──< Session
                  ──< JoineeEnrollment ──── PersonalizedProject ──< PersonalizedModule
                                        ──── Joinee
```

---

## API Layer — tRPC Routers

All API calls go through tRPC at `/api/trpc`. The routers are:

### project.*
| Procedure | Auth | Description |
|---|---|---|
| `project.create` | Protected | Create a new project (title + description) |
| `project.list` | Protected | List all projects owned by the current user |
| `project.getById` | Protected | Get a project with all its modules |
| `project.update` | Protected | Update title or description |
| `project.delete` | Protected | Delete a project and all its modules |
| `project.publish` | Protected | Generate a slug and make the project public |
| `project.getPublished` | Public | Get a published project by slug (for joinee view) |

### module.*
| Procedure | Auth | Description |
|---|---|---|
| `module.add` | Protected | Add a module at a specific position (shifts others) |
| `module.update` | Protected | Update a module's title or content |
| `module.reorder` | Protected | Reorder all modules by providing ordered IDs |
| `module.delete` | Protected | Delete a module and re-index positions |

### session.*
| Procedure | Auth | Description |
|---|---|---|
| `session.create` | Protected | Start a new AI co-development session |
| `session.applyChange` | Protected | Apply a proposed change, saving a snapshot to history |
| `session.undo` | Protected | Restore the project to the state before the last change |

### enrollment.*
| Procedure | Auth | Description |
|---|---|---|
| `enrollment.create` | Protected | Enroll a new hire against a published project |
| `enrollment.list` | Protected | List all enrollments for the current recruiter |
| `enrollment.getById` | Protected | Get enrollment with source project and personalized project |
| `enrollment.submitProfile` | Protected | Save the joinee profile and advance to PERSONALIZE stage |
| `enrollment.updateSpec` | Protected | Override a spec's adaptation type or content depth |
| `enrollment.approve` | Protected | Validate coverage, generate PersonalizedProject, create slug |
| `enrollment.regenerate` | Protected | Clear the plan and allow re-generation |
| `enrollment.getBySlug` | Public | Get a personalized project by joinee slug (no auth) |

---

## AI Integration

The platform uses Grok (xAI) via the Vercel AI SDK's OpenAI-compatible provider. Three AI routes handle different stages:

### /api/ai/intro — Seed Layout Generation
- **Input:** Onboarding goals, baseline requirements, optional GitHub repo content
- **Output:** Structured JSON with 5-7 module stubs (type + title + description)
- **Method:** `generateObject` with a Zod schema ensuring valid module types and titles
- **System prompt:** Acts as a "Curriculum Architect" — decomposes goals into competencies, maps dependencies, selects module types, validates constraints

### /api/ai/chat — Co-Development Streaming
- **Input:** Conversation history + current project snapshot
- **Output:** A single `ProposedChange` object (add/update/delete module or update metadata)
- **Method:** `streamObject` for real-time streaming to the chat UI
- **System prompt:** Acts as an "Onboarding Content Engineer" — classifies intent, identifies scope, generates complete content, assesses impact

### /api/ai/personalize — Personalization Plan
- **Input:** Joinee profile + source project snapshot + optional recruiter note
- **Output:** `PersonalizationPlan` with summary + array of `PersonalizedModuleSpec` objects
- **Method:** `generateObject` with a Zod schema
- **System prompt:** Acts as an "Adaptive Learning Architect" — analyzes profile, performs gap analysis, constructs adapted path, generates full content for each module
- **Post-processing:** Enforces module count cap (trims excess supplementals), validates coverage

---

## GitHub Repo Parser

When a Designer provides a GitHub repo URL during the Intro stage, the system:

1. Extracts `owner/repo` from the URL
2. Fetches the full file tree via GitHub API (`GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1`)
3. Filters files: keeps `.md`, `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rs`, `.java`, `.rb`, `.yml`, `.yaml`, `.json`, `.toml`, `.env.example`
4. Skips directories: `node_modules`, `.git`, `dist`, `build`, `.next`, `__pycache__`, `.venv`, `vendor`, `coverage`
5. Fetches content of each file (base64 decoded), truncating at 500 lines per file
6. Caps total output at 80,000 characters
7. Supports private repos via an optional GitHub personal access token

The parsed content is sent to the AI as context, so generated modules can reference actual file names, directory structures, and code patterns from the real codebase.

---

## Authentication

- **Provider:** Google OAuth via NextAuth.js v5 (Auth.js)
- **Session strategy:** JWT (stateless, no DB session table)
- **User creation:** On first sign-in, a `User` record is created via upsert
- **Token enrichment:** The JWT callback looks up the user's database ID and attaches it as `token.userId`
- **Session enrichment:** The session callback copies `token.userId` to `session.user.id`
- **Protected routes:** tRPC `protectedProcedure` checks for `session.user.id` and throws `UNAUTHORIZED` if missing
- **Public routes:** Joinee views (`/p/[slug]`, `/learn/[joineeSlug]`) use `publicProcedure` — no auth required

---

## Client-Side State

**Zustand store (`useBuilderStore`)** manages the edit workspace state:
- `sessionId` — current AI co-development session
- `messages` — chat history (user + assistant messages)
- `pendingChange` — the current proposed change awaiting approval/rejection
- `isSaving` / `saveError` — auto-save status

**React Query** (via tRPC) handles all server state — project data, module lists, enrollment data. Cache invalidation happens automatically after mutations.

---

## Module Content Types

All module content is stored as JSONB in the database. The content is a discriminated union:

### RICH_TEXT
```json
{ "type": "RICH_TEXT", "html": "<h2>Welcome</h2><p>This is your onboarding...</p>" }
```
Rendered as HTML in the preview and joinee views.

### INTERACTIVE_VISUAL
```json
{
  "type": "INTERACTIVE_VISUAL",
  "visualType": "flowchart",
  "mermaidDefinition": "graph TD; A[Start] --> B[Process]; B --> C[End]",
  "annotations": [{ "nodeId": "B", "label": "Core Logic", "detail": "This is where the main processing happens" }]
}
```
Rendered using Mermaid.js with hover/click annotations.

### CODE_EDITOR
```json
{
  "type": "CODE_EDITOR",
  "language": "python",
  "starterCode": "def greet(name):\n    # TODO: return greeting\n    pass",
  "solution": "def greet(name):\n    return f'Hello, {name}!'",
  "hint": "Use an f-string to format the greeting",
  "expectedOutput": "Hello, World!"
}
```
Rendered with a code editor (Monaco) and a run button that executes via the Piston API.

---

## Personalization Adaptation Types

| Type | What It Means | Content Treatment |
|---|---|---|
| **STANDARD** | Normal adaptation | Content depth adjusted (foundational/standard/advanced) based on experience |
| **FAST_TRACK** | Joinee already knows this topic | Condensed to a 2-3 paragraph recap + mandatory self-check quiz (2-5 questions) |
| **SUPPLEMENTAL** | Prerequisite knowledge gap detected | A new module inserted before the target module to teach the missing foundation |
| **ADVANCED** | Joinee is highly experienced | Focuses on edge cases, performance, design trade-offs; skips basics |

---

## Self-Check Quizzes

Fast-tracked modules include a `selfCheckQuiz` in their content:

```json
{
  "selfCheckQuiz": {
    "questions": [
      {
        "prompt": "What happens when a request hits the /api/auth endpoint?",
        "options": ["It returns 404", "NextAuth processes the OAuth flow", "It redirects to /login", "It creates a new user"],
        "correctIndex": 1,
        "explanation": "The [...nextauth] catch-all route delegates to NextAuth.js which handles the full OAuth flow."
      }
    ]
  }
}
```

The quiz UI:
- Shows all questions with radio button options
- On submit, highlights correct answers (green) and incorrect selections (red)
- Shows explanations for each question
- Records pass/fail result in localStorage

---

## Progress Tracking

Joinee progress is stored in `localStorage` (no server-side account needed):

```
Key: opb_progress_[joineeSlug]
Value: {
  joineeSlug: "abc123",
  completedModuleIds: ["mod1", "mod2"],
  quizResults: [{ moduleId: "mod1", passed: true, attemptedAt: "2026-04-11T..." }],
  lastVisited: "2026-04-11T..."
}
```

The progress bar in the sidebar shows `completedModuleIds.length / totalModules`.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| AI generation fails or times out | Error message shown; user can retry. Profile/data is preserved. |
| AI returns malformed JSON | Zod validation catches it; error surfaced to user |
| Enrollment against unpublished project | `PRECONDITION_FAILED` error with clear message |
| Personalization plan missing module coverage | Approval blocked; missing modules listed in error |
| Module count exceeds 1.5x cap | Excess supplementals trimmed; warning added to plan summary |
| Database not configured | App runs in demo mode with placeholder data |
| Auto-save fails | Error toast shown; unsaved changes retained in Zustand state |

---

## Setup Guide

### Prerequisites
- Node.js 18+
- A Neon account (free tier) for PostgreSQL
- A Google Cloud project with OAuth credentials
- A Grok (xAI) API key

### Steps

```bash
# 1. Install dependencies
cd onboarding-builder
npm install

# 2. Configure environment
cp .env.example .env   # or edit .env directly
# Fill in: DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, GROK_API_KEY

# 3. Generate AUTH_SECRET
openssl rand -base64 32

# 4. Run database migration
npx prisma migrate dev --name init

# 5. Generate Prisma client
npx prisma generate

# 6. Start dev server
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Random secret for NextAuth JWT signing |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth Client Secret |
| `GROK_API_KEY` | Yes | xAI API key for Grok |
| `GROK_BASE_URL` | No | Defaults to `https://api.x.ai/v1` |
| `GROK_MODEL` | No | Defaults to `grok-3` |
| `PISTON_API_URL` | No | Defaults to `https://emkc.org/api/v2/piston` |

---

## Deployment

### Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables in the Vercel dashboard. Update the Google OAuth redirect URI to include your Vercel domain:
```
https://your-app.vercel.app/api/auth/callback/google
```

The `vercel.json` is pre-configured with `npx prisma generate && next build` as the build command.

---

## Routes Reference

| Route | Access | Description |
|---|---|---|
| `/` | Public | Redirects to `/dashboard` |
| `/login` | Public | Google OAuth sign-in page |
| `/dashboard` | Auth | Designer project list + create/delete |
| `/builder/[projectId]/intro` | Auth | Intro questionnaire (Stage 2) |
| `/builder/[projectId]/edit` | Auth | AI co-development workspace (Stage 3) |
| `/p/[slug]` | Public | Published generalized project view |
| `/recruiter/dashboard` | Auth | Recruiter enrollment list + add employee |
| `/recruiter/enrollments/[id]/profile` | Auth | Joinee profile form |
| `/recruiter/enrollments/[id]/personalize` | Auth | Plan review + approve/regenerate |
| `/learn/[joineeSlug]` | Public | Personalized joinee onboarding view |
