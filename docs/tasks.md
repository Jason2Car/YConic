# Implementation Plan: Onboarding Project Builder

## Overview

Implement the Onboarding Project Builder as a full-stack Next.js 14 application following the three-stage designer workflow (Init → Intro → Edit). Tasks are organized across five sprints matching the design's milestone plan. Each task builds incrementally on the previous, ending with a fully wired, production-ready application.

## Tasks

---

## Sprint 1 — Foundation (Weeks 1–2)

- [ ] 1. Scaffold Next.js 14 project with core tooling
  - Initialize Next.js 14 app with App Router, TypeScript strict mode, and Tailwind CSS
  - Install and configure shadcn/ui (add Button, Input, Textarea, Dialog, Toast, Card, Badge primitives)
  - Set up ESLint + Prettier with TypeScript rules
  - Configure path aliases (`@/` → `src/`) in `tsconfig.json`
  - Create base layout (`src/app/layout.tsx`) with Tailwind globals and font setup
  - _Requirements: 0.1, 1.1_

- [ ] 2. Configure Prisma and PostgreSQL schema
  - [ ] 2.1 Write Prisma schema with all models
    - Define `User`, `Project` (with `stage` field: `"init" | "intro" | "edit"`, `slug`, `published`), `Module` (with `ModuleType` enum, `position`, `content` Json), and `Session` (with `history` Json) models exactly as specified in the design
    - Add `@@index([projectId, position])` on `Module`
    - Configure `DATABASE_URL` in `.env.example`
    - Run `prisma migrate dev --name init` to generate the initial migration
    - _Requirements: 0.8, 1.1, 3.2, 7.4_

  - [ ] 2.2 Create Prisma client singleton
    - Write `src/server/db/prisma.ts` exporting a singleton `PrismaClient` instance (dev hot-reload safe)
    - _Requirements: 7.4_

- [ ] 3. Implement NextAuth.js with Google OAuth
  - [ ] 3.1 Configure NextAuth.js (Auth.js v5)
    - Install `next-auth@beta` and configure `src/auth.ts` with Google OAuth provider
    - Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET` to `.env.example`
    - Create `src/app/api/auth/[...nextauth]/route.ts` handler
    - Implement Prisma adapter to persist `User` records on first sign-in
    - _Requirements: 1.1, 1.3_

  - [ ] 3.2 Build login page
    - Create `src/app/(auth)/login/page.tsx` with a "Sign in with Google" button using shadcn/ui
    - Add auth guard middleware (`src/middleware.ts`) that redirects unauthenticated requests to `/login` for all `/dashboard` and `/builder` routes
    - _Requirements: 1.1_

- [ ] 4. Set up tRPC with project router
  - [ ] 4.1 Initialize tRPC infrastructure
    - Install `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`, `zod`
    - Create `src/server/trpc/trpc.ts` with context (session + db), `publicProcedure`, and `protectedProcedure`
    - Create `src/app/api/trpc/[trpc]/route.ts` handler
    - Create `src/lib/trpc/client.ts` and `src/lib/trpc/provider.tsx` for client-side usage
    - _Requirements: 1.1_

  - [ ] 4.2 Implement `project` tRPC router
    - Write `src/server/trpc/router/project.ts` with procedures: `create` (writes `Project` row with `stage: "init"`), `list` (returns only caller's projects), `getById` (includes modules), `update`, `delete` (hard delete with cascade)
    - Add Zod input schemas for each procedure
    - Wire into root router at `src/server/trpc/index.ts`
    - _Requirements: 0.1, 1.1, 1.2, 1.3_

  - [ ]* 4.3 Write unit tests for project CRUD procedures
    - Test `project.create` returns a project with correct `ownerId` and `stage: "init"`
    - Test `project.list` returns only the authenticated user's projects
    - Test `project.delete` cascades to modules
    - Test unauthenticated calls to `protectedProcedure` are rejected with `UNAUTHORIZED`
    - _Requirements: 1.2, 1.3_

- [ ] 5. Build Dashboard page
  - [ ] 5.1 Implement project list UI
    - Create `src/app/dashboard/page.tsx` as a React Server Component that fetches `project.list` and renders a grid of project cards (title, description, created date, published badge)
    - _Requirements: 1.2_

  - [ ] 5.2 Implement `NewProjectForm` and create flow
    - Create `src/components/init/NewProjectForm.tsx` — a modal form (shadcn/ui Dialog) with title (required) and description fields
    - On submit, call `project.create` tRPC mutation, then redirect to `/builder/[projectId]/intro`
    - _Requirements: 0.1, 0.2, 1.1_

  - [ ] 5.3 Implement project delete with two-step confirmation
    - Add a delete button on each project card that opens a confirmation Dialog
    - Implement `project.requestDelete` tRPC procedure (returns a short-lived confirmation token stored in session) and `project.confirmDelete(token)` procedure
    - Token expires after 60 seconds; expired token returns `PRECONDITION_FAILED`
    - _Requirements: 1.3, 1.4_

- [ ] 6. Sprint 1 checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


---

## Sprint 2 — Builder Workspace & AI Integration (Weeks 3–4)

- [ ] 7. Implement Stage 2 — Intro questionnaire
  - [ ] 7.1 Build `IntroQuestionnaire` and sub-components
    - Create `src/components/intro/GoalsInput.tsx` — a labeled `<textarea>` for free-text onboarding goals
    - Create `src/components/intro/BaselineChecklist.tsx` — a dynamic checklist (add/remove items) for prior knowledge requirements
    - Create `src/components/intro/ExamplesUpload.tsx` — accepts file upload (PDF/image) or URL paste; stores as base64 or URL string
    - Compose all three into `src/components/intro/IntroQuestionnaire.tsx` with a "Generate Layout" submit button
    - _Requirements: 0.3_

  - [ ] 7.2 Implement `/api/ai/intro` route
    - Create `src/app/api/ai/intro/route.ts` as a Next.js Route Handler
    - Write `src/lib/ai/introRules.ts` with the predefined Intro Rules system prompt (Welcome module first, 5–7 modules max, include visual if goals mention processes, include code exercise if goals mention technical skills, titles ≤ 6 words)
    - Define `SeedLayout` Zod schema: `{ modules: Array<{ type: ModuleType; title: string; description: string }> }`
    - Use Vercel AI SDK `streamObject` with `SeedLayout` schema and GPT-4o; enforce 15-second timeout via `AbortController`
    - _Requirements: 0.4, 0.5_

  - [ ] 7.3 Wire Intro stage to database and stage transition
    - Create `src/app/builder/[projectId]/intro/page.tsx` — renders `IntroQuestionnaire`; redirects to `/builder/[projectId]/edit` if project `stage` is already `"edit"`
    - On questionnaire submit: POST to `/api/ai/intro`, receive `SeedLayout`, call `module.add` for each stub (content: null), call `project.update` to set `stage: "edit"`, then redirect to edit page
    - _Requirements: 0.4, 0.5, 0.6, 0.8, 0.9_

- [ ] 8. Build Builder workspace layout (Edit stage)
  - [ ] 8.1 Create split-pane workspace shell
    - Create `src/app/builder/[projectId]/edit/page.tsx` — server component that validates `stage === "edit"` (redirects to intro if not), loads project + modules, renders the workspace
    - Build a resizable split-pane layout (CSS Grid or `react-resizable-panels`) with `ChatPanel` on the left and `PreviewPanel` on the right
    - Add a top bar with project title, save status indicator, and "Publish" button placeholder
    - _Requirements: 0.7, 2.1, 2.4_

  - [ ] 8.2 Implement `PreviewPanel`
    - Create `src/components/builder/PreviewPanel.tsx` — renders the ordered list of module stubs/content using `ModuleStub` placeholders for null-content modules
    - Create `src/components/modules/ModuleStub.tsx` — a card showing module type icon, title, and description for AI-seeded stubs
    - _Requirements: 2.4, 0.6_

- [ ] 9. Implement AI chat route and session procedures
  - [ ] 9.1 Implement `/api/ai/chat` route
    - Create `src/app/api/ai/chat/route.ts`
    - Write `src/lib/ai/schemas.ts` with `ProposedChange` Zod schema (discriminated union: `add_module | update_module | delete_module | update_project_meta`) and `ProjectSnapshot` type
    - Write `src/lib/ai/prompts.ts` with the Edit-stage system prompt (includes current project snapshot as context)
    - Use Vercel AI SDK `streamObject` with `ProposedChange` schema; on Zod validation failure, retry once with an amended prompt instructing the model to fix its output format
    - Return structured error `{ error: "AI assistant temporarily unavailable" }` on OpenAI API failure
    - _Requirements: 2.2, 2.3_

  - [ ] 9.2 Implement `session` tRPC router
    - Write `src/server/trpc/router/session.ts` with `session.create` (creates Session row), `session.applyChange` (appends `RevisionEntry` to `history`, applies change to Project/Module rows), and `session.undo` (pops last `RevisionEntry`, restores `snapshotBefore`)
    - Wire into root tRPC router
    - _Requirements: 2.5, 2.6, 2.7_

  - [ ]* 9.3 Write property test P3: Approve-then-retrieve round trip
    - **Property 3: For any `ProposedChange` approved by the Designer, the project state retrieved from the database immediately after approval should reflect that change exactly**
    - Use `fast-check` to generate random `ProposedChange` payloads (add/update/delete module variants)
    - Call `session.applyChange`, then `project.getById`, assert the returned state matches the applied change
    - Run minimum 100 iterations
    - // Feature: onboarding-project-builder, Property 3: Approve-then-retrieve round trip
    - **Validates: Requirements 2.5**

  - [ ]* 9.4 Write property test P4: Undo restores previous state
    - **Property 4: For any sequence of accepted changes, applying undo should restore the project to the exact state before the most recently accepted change**
    - Use `fast-check` to generate random sequences of 1–10 `ProposedChange` operations
    - Apply all changes, call `session.undo`, assert project state equals `snapshotBefore` of the last `RevisionEntry`
    - Run minimum 100 iterations
    - // Feature: onboarding-project-builder, Property 4: Undo restores previous state
    - **Validates: Requirements 2.7**

- [ ] 10. Implement `ChatPanel` and approve/reject UI
  - [ ] 10.1 Build `ChatPanel` component
    - Create `src/components/builder/ChatPanel.tsx` — message list (user + AI bubbles), text input, send button
    - Use Vercel AI SDK `useChat` hook pointed at `/api/ai/chat`; include current `ProjectSnapshot` in request body
    - Show a loading spinner while streaming; display the AI's `description` field as a preview before the full `ProposedChange` arrives
    - On AI API error, display `"The AI assistant is temporarily unavailable. Please try again."` inline
    - _Requirements: 2.2, 2.3_

  - [ ] 10.2 Build `ProposedChangeCard` and `RevisionHistoryBar`
    - Create `src/components/builder/ProposedChangeCard.tsx` — shows change description with "Approve" and "Reject" buttons; on approve calls `session.applyChange`; on reject sends a follow-up message to the AI acknowledging rejection
    - Create `src/components/builder/RevisionHistoryBar.tsx` — shows last N accepted change descriptions with an "Undo" button that calls `session.undo`
    - _Requirements: 2.5, 2.6, 2.7_

- [ ] 11. Implement Zustand store and auto-save
  - [ ] 11.1 Create Zustand session store
    - Create `src/lib/store/sessionStore.ts` with Zustand: state includes `revisionHistory: RevisionEntry[]`, `pendingChange: ProposedChange | null`, `saveStatus: "saved" | "saving" | "error"`
    - Actions: `pushRevision`, `popRevision`, `setPendingChange`, `setSaveStatus`
    - _Requirements: 2.7, 7.1_

  - [ ] 11.2 Implement auto-save with exponential backoff retry
    - In `ChatPanel` / `ProposedChangeCard`, after `session.applyChange` succeeds, trigger auto-save: call `project.update` tRPC mutation within 5 seconds
    - On failure, show toast `"Auto-save failed. Your changes are preserved in this session."` and retry with exponential backoff (1s, 2s, 4s), up to 3 attempts
    - Update `saveStatus` in Zustand store accordingly; show save status in the workspace top bar
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 12. Sprint 2 checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


---

## Sprint 3 — Module Types (Weeks 5–6)

- [ ] 13. Implement `module` tRPC router
  - [ ] 13.1 Write module CRUD and reorder procedures
    - Write `src/server/trpc/router/module.ts` with: `module.add` (inserts Module row, assigns next position), `module.update` (updates `content` Json), `module.reorder` (accepts `orderedIds`, updates `position` for each in a transaction), `module.delete` (checks for unsaved content in active session; returns `PRECONDITION_FAILED` if found, otherwise deletes)
    - Wire into root tRPC router
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]* 13.2 Write property test P5: Module order preservation
    - **Property 5: For any reordering of modules, the order stored in the database and presented to the Joinee should be identical to the specified order**
    - Use `fast-check` to generate random lists of module IDs and random permutations
    - Call `module.reorder`, then `project.getById`, assert returned module array order matches input `orderedIds`
    - Run minimum 100 iterations
    - // Feature: onboarding-project-builder, Property 5: Module order preservation
    - **Validates: Requirements 3.4, 6.2**

  - [ ]* 13.3 Write property test P6: Module ID uniqueness
    - **Property 6: For any number of modules added to a project, all assigned module IDs should be unique**
    - Use `fast-check` to generate random counts (1–50) of `module.add` calls on the same project
    - Assert all returned IDs are distinct (no duplicates within the project)
    - Run minimum 100 iterations
    - // Feature: onboarding-project-builder, Property 6: Module ID uniqueness
    - **Validates: Requirements 3.2**

- [ ] 14. Implement `RichTextModule` with Tiptap
  - [ ] 14.1 Build Tiptap editor component
    - Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`
    - Create `src/components/modules/RichTextModule.tsx` — renders Tiptap editor in edit mode and sanitized HTML in read-only (Joinee) mode
    - On blur/change, call `module.update` with `{ type: "RICH_TEXT", html: editor.getHTML() }`
    - _Requirements: 3.3_

- [ ] 15. Implement `VisualModule` with Mermaid.js
  - [ ] 15.1 Build Mermaid renderer with hover/click annotations
    - Install `mermaid`
    - Create `src/components/modules/VisualModule.tsx` — lazy-loads Mermaid, renders `mermaidDefinition` to SVG, attaches hover tooltip and click-expand handlers using `Annotation[]` metadata (match `nodeId` to SVG element IDs)
    - Ensure SVG is responsive (100% width, `viewBox` preserved) for mobile (375px) and desktop (1280px)
    - In edit mode, show a Mermaid syntax textarea that calls `module.update` on change
    - _Requirements: 3.3, 4.1, 4.3, 4.4, 4.5, 4.6_

- [ ] 16. Implement `CodeEditorModule` with Monaco Editor
  - [ ] 16.1 Build Monaco editor component
    - Install `@monaco-editor/react`
    - Create `src/components/modules/CodeEditorModule.tsx` — lazy-loads Monaco, renders editor with language-specific syntax highlighting (Python/JS/TS), starter code pre-populated
    - In edit mode, show language selector, starter code editor, optional hint/solution fields; call `module.update` on save
    - In Joinee mode, render Monaco in read-only-starter mode with a "Run" button and output panel below
    - _Requirements: 3.3, 5.1, 5.2, 5.3_

  - [ ]* 16.2 Write property test P7: Code editor config round trip
    - **Property 7: For any valid `CodeEditorContent` (language, starter code, optional solution, optional hint), storing and retrieving it should produce a configuration equal to the original**
    - Use `fast-check` to generate random `CodeEditorContent` objects (random language, arbitrary strings for code/solution/hint)
    - Call `module.update`, then `module` query, assert deep equality of returned content
    - Run minimum 100 iterations
    - // Feature: onboarding-project-builder, Property 7: Code editor config round trip
    - **Validates: Requirements 5.2**

- [ ] 17. Implement code execution proxy
  - [ ] 17.1 Build Piston API client
    - Create `src/lib/piston.ts` — typed wrapper around the Piston REST API (`POST /api/v2/execute`); accepts `{ language, code }`, returns `{ stdout, stderr, exitCode }`
    - Configure Piston base URL via `PISTON_API_URL` env var
    - _Requirements: 5.4_

  - [ ] 17.2 Build `/api/execute` proxy route
    - Create `src/app/api/execute/route.ts`
    - Validate request body with Zod: `{ language: "python" | "javascript" | "typescript"; code: string }`
    - Enforce 15-second timeout using `AbortController`; on abort return `{ timedOut: true, stdout: "", stderr: "Execution timed out after 15 seconds." }`
    - Strip internal Piston container paths from `stderr` (lines matching `/piston\/jobs\/.*/`) before returning
    - Return 503 with `"Code execution is temporarily unavailable."` if Piston is unreachable
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ]* 17.3 Write property test P8: Error message safety
    - **Property 8: For any code submission that produces a runtime error, the error message displayed to the Joinee should not contain internal system details**
    - Use `fast-check` to generate random error-producing code snippets (syntax errors, division by zero, undefined variable)
    - Call `/api/execute`, assert `stderr` does not match `/piston\/jobs\//`, does not contain absolute file paths, does not contain environment variable names
    - Run minimum 100 iterations
    - // Feature: onboarding-project-builder, Property 8: Error message safety
    - **Validates: Requirements 5.6**

  - [ ] 17.4 Wire code execution into `CodeEditorModule`
    - In Joinee mode, connect the "Run" button to `POST /api/execute`; display `stdout` in the output panel on success, `stderr` on error, and the timeout message on `timedOut: true`
    - After a failed run (non-zero `exitCode`), show "Reveal Hint" button (if `hint` configured) and "Reveal Solution" button (if `solution` configured)
    - _Requirements: 5.4, 5.5, 5.6, 5.7_

- [ ] 18. Sprint 3 checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


---

## Sprint 4 — Joinee Experience & Publishing (Weeks 7–8)

- [ ] 19. Implement publishing flow
  - [ ] 19.1 Implement `project.publish` tRPC procedure
    - Add `project.publish` to `src/server/trpc/router/project.ts`: generate a URL-safe slug from the project title + a short random suffix (e.g., `kebab-title-a1b2`), ensure uniqueness with a DB uniqueness check + retry loop, set `published: true` and `slug` on the Project row, return `{ slug, url }`
    - _Requirements: 1.5, 1.6_

  - [ ]* 19.2 Write property test P2: Published project URL uniqueness
    - **Property 2: For any set of published Onboarding Projects, all generated slugs should be distinct**
    - Use `fast-check` to generate random sets of project titles (including duplicates and edge cases like empty strings, unicode, very long titles)
    - Call `project.publish` for each, assert all returned slugs are unique across the set
    - Run minimum 100 iterations
    - // Feature: onboarding-project-builder, Property 2: Published project URL uniqueness
    - **Validates: Requirements 1.6**

  - [ ] 19.3 Wire "Publish" button in workspace
    - Connect the "Publish" button in the builder top bar to `project.publish`; on success, show a toast with the shareable URL and a "Copy link" button
    - _Requirements: 1.5, 1.6_

- [ ] 20. Build Joinee public view
  - [ ] 20.1 Create `/p/[slug]` page
    - Create `src/app/p/[slug]/page.tsx` as a React Server Component
    - Fetch project by slug using a public (no-auth) tRPC procedure `project.getBySlug`; return 404 if not found or not published
    - Add `project.getBySlug` to the project router as a `publicProcedure`
    - Render `ModuleList` and `ModuleViewer` components; no session cookie required
    - _Requirements: 6.1_

  - [ ] 20.2 Implement `ModuleList` navigation component
    - Create `src/components/joinee/ModuleList.tsx` — vertical sidebar listing all modules in Designer-defined order with completion checkmarks; clicking a module scrolls to or navigates to it
    - _Requirements: 6.2, 6.3_

  - [ ] 20.3 Implement `ModuleViewer` read-only renderer
    - Create `src/components/joinee/ModuleViewer.tsx` — renders each module in read-only mode: `RichTextModule` (HTML output), `VisualModule` (Mermaid SVG + annotations), `CodeEditorModule` (Monaco read-only starter + Run button)
    - Include a "Mark as Complete" button per module that updates localStorage progress
    - _Requirements: 6.2, 6.3_

  - [ ] 20.4 Implement `ProgressBar` component
    - Create `src/components/joinee/ProgressBar.tsx` — reads `completedModuleIds` from localStorage key `opb_progress_${projectSlug}`, displays `"X of Y modules complete"` and a filled progress bar
    - _Requirements: 6.5_

- [ ] 21. Implement localStorage progress persistence
  - [ ] 21.1 Write progress read/write utilities
    - Create `src/lib/progress.ts` with `getProgress(slug): JoineeProgress`, `markComplete(slug, moduleId): void`, and `resetProgress(slug): void` functions operating on `localStorage` key `opb_progress_${slug}`
    - Handle missing/corrupt localStorage data gracefully (return empty progress)
    - _Requirements: 6.4_

  - [ ] 21.2 Wire progress utilities into Joinee view
    - On page load in `/p/[slug]`, call `getProgress` and pass `completedModuleIds` to `ModuleList` and `ProgressBar`
    - On "Mark as Complete" click, call `markComplete` and re-render progress state
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ]* 21.3 Write property test P9: Progress indicator accuracy
    - **Property 9: For any combination of completed and incomplete modules, the progress indicator should display a count equal to the number of completed module IDs in the Joinee's progress record**
    - Use `fast-check` to generate random arrays of total module IDs and random subsets as completed
    - Write progress to localStorage, render `ProgressBar`, assert displayed count equals `completedModuleIds.length` and total equals `modules.length`
    - Run minimum 100 iterations
    - // Feature: onboarding-project-builder, Property 9: Progress indicator accuracy
    - **Validates: Requirements 6.5**

  - [ ]* 21.4 Write property test P10: Progress persistence round trip
    - **Property 10: For any set of modules marked complete, the completion state written to localStorage should be fully recoverable after a page refresh**
    - Use `fast-check` to generate random sets of module IDs to mark complete
    - Call `markComplete` for each, then call `getProgress`, assert `completedModuleIds` contains exactly the marked IDs (no additions, no losses)
    - Run minimum 100 iterations
    - // Feature: onboarding-project-builder, Property 10: Progress persistence round trip
    - **Validates: Requirements 6.4**

- [ ] 22. Implement project list completeness property test
  - [ ]* 22.1 Write property test P1: Project list completeness
    - **Property 1: For any Designer and any set of projects they have created, `project.list()` should return exactly those projects — no projects from other designers, no missing projects**
    - Use `fast-check` to generate random sets of projects for two distinct designer users
    - Create all projects, call `project.list` as each designer, assert each list contains exactly their own projects and no cross-contamination
    - Run minimum 100 iterations
    - // Feature: onboarding-project-builder, Property 1: Project list completeness
    - **Validates: Requirements 1.2, 1.3**

- [ ] 23. Sprint 4 checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


---

## Sprint 5 — Polish, Error Handling & QA (Weeks 9–10)

- [ ] 24. Harden error handling and edge cases
  - [ ] 24.1 Implement unsaved-content guard on module deletion
    - In `module.delete` tRPC procedure, query the active Session for the project and check `history` for any `RevisionEntry` whose `snapshotBefore` differs from current module content (i.e., pending unsaved diff)
    - Return `PRECONDITION_FAILED` tRPC error if unsaved content exists; the frontend intercepts this to show a shadcn/ui confirmation Dialog before allowing deletion
    - _Requirements: 3.5_

  - [ ] 24.2 Implement auto-save failure toast and retry UI
    - In `src/lib/store/sessionStore.ts`, implement the retry scheduler: on `setSaveStatus("error")`, schedule retries at 1s, 2s, 4s using `setTimeout`; cancel pending retries on successful save
    - Render a persistent toast (shadcn/ui Toast) with `"Auto-save failed. Your changes are preserved in this session."` while `saveStatus === "error"`; dismiss on successful retry
    - After 3 failed retries, show an additional prompt: `"Please copy your work or reload the page."`
    - _Requirements: 7.3_

  - [ ] 24.3 Implement code execution timeout message and error sanitization
    - Verify `/api/execute` correctly returns `{ timedOut: true }` for submissions exceeding 15 seconds (write a unit test submitting an infinite loop with a mocked 15s `AbortController`)
    - Verify `stderr` sanitization strips Piston internal paths (unit test with synthetic stderr containing `/piston/jobs/abc123/...`)
    - _Requirements: 5.5, 5.6_

  - [ ] 24.4 Implement hint and solution reveal flow
    - In `CodeEditorModule` Joinee mode, after a failed run (non-zero `exitCode` or `timedOut`), show a "Reveal Hint" button (only if `hint` is non-empty) and a "Reveal Solution" button (only if `solution` is non-empty)
    - Clicking "Reveal Hint" renders the hint text inline; clicking "Reveal Solution" replaces the editor content with the solution code
    - _Requirements: 5.7_

- [ ] 25. Write integration test suite
  - [ ]* 25.1 Integration test: End-to-end AI session
    - Mock OpenAI API response (using `msw` or Jest module mock) to return a valid `ProposedChange` within 10 seconds
    - Send a natural language instruction via `ChatPanel`, assert `ProposedChangeCard` renders with the correct description within 10 seconds
    - _Requirements: 2.3_

  - [ ]* 25.2 Integration test: Auto-save timing
    - Accept a proposed change and assert that the `project.update` tRPC mutation is called within 5 seconds (use `vi.useFakeTimers` or real timers with a 6s timeout)
    - _Requirements: 7.1_

  - [ ]* 25.3 Integration test: Code execution latency
    - Submit a simple Python `print("hello")` snippet to `/api/execute` against a running Piston instance and assert a response with `stdout: "hello\n"` arrives within 15 seconds
    - _Requirements: 5.4_

  - [ ]* 25.4 Integration test: Joinee no-auth access
    - Publish a project, then make a request to `/p/[slug]` without a session cookie, assert the page renders with HTTP 200 and module content is visible
    - _Requirements: 6.1_

  - [ ]* 25.5 Integration test: Auto-save failure and retry
    - Mock `project.update` to fail 3 times, assert toast notification appears and retry attempts are made at 1s, 2s, 4s intervals; assert final failure prompt is shown
    - _Requirements: 7.3_

- [ ] 26. Write smoke tests
  - [ ]* 26.1 Smoke test: Database connectivity
    - Write a test that calls `prisma.$queryRaw\`SELECT 1\`` and asserts it resolves without error
    - _Requirements: 7.4_

  - [ ]* 26.2 Smoke test: Piston availability
    - Write a test that sends a GET to the Piston `/api/v2/runtimes` endpoint and asserts HTTP 200 with a non-empty runtimes array
    - _Requirements: 5.4_

  - [ ]* 26.3 Smoke test: Builder workspace renders both panels
    - Using a headless browser test (Playwright), navigate to `/builder/[projectId]/edit` as an authenticated Designer, assert both `ChatPanel` and `PreviewPanel` are visible in the DOM
    - _Requirements: 2.4_

  - [ ]* 26.4 Smoke test: Responsive Mermaid rendering
    - Using Playwright, render a `VisualModule` with a sample flowchart at 375px and 1280px viewport widths, assert the SVG element is present and has non-zero dimensions at both sizes
    - _Requirements: 4.6_

- [ ] 27. Accessibility audit
  - [ ] 27.1 Add ARIA labels and keyboard navigation
    - Audit all interactive components (`ChatPanel`, `ProposedChangeCard`, `ModuleList`, `ProgressBar`, `CodeEditorModule`) for missing `aria-label`, `role`, and `aria-live` attributes
    - Ensure all buttons and interactive elements are reachable and activatable via keyboard (Tab + Enter/Space)
    - Ensure `ProgressBar` uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
    - Ensure modal dialogs (delete confirmation, proposed change) trap focus and restore focus on close
    - _Requirements: 4.4, 6.3_

- [ ] 28. Performance review
  - [ ] 28.1 Lazy-load Monaco Editor and Mermaid.js
    - Wrap `@monaco-editor/react` import in `next/dynamic` with `{ ssr: false, loading: () => <Skeleton /> }`
    - Wrap Mermaid initialization in `next/dynamic` or a `useEffect`-based lazy import to prevent SSR inclusion
    - Verify neither library appears in the initial page bundle using `next build --analyze` (or `@next/bundle-analyzer`)
    - _Requirements: 4.6, 5.3_

- [ ] 29. Final wiring and end-to-end validation
  - [ ] 29.1 Verify complete three-stage flow end-to-end
    - Trace the full path: Dashboard → NewProjectForm → `/builder/[id]/intro` → IntroQuestionnaire submit → AI seed → `/builder/[id]/edit` → ChatPanel instruction → ProposedChangeCard approve → auto-save → Publish → `/p/[slug]` Joinee view → Mark modules complete → ProgressBar updates
    - Fix any broken wiring, missing redirects, or unhandled loading/error states discovered during the trace
    - _Requirements: 0.1–0.9, 1.1–1.6, 2.1–2.7, 6.1–6.5, 7.1–7.4_

- [ ] 30. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Team Structure & Ownership

| Role | Owner | Sprints | Responsibilities |
|---|---|---|---|
| **AI / Backend Lead** | Jason C. | S1–S2 | Prisma schema, tRPC routers, AI chat route (`streamObject` + Zod), session.applyChange transaction, auto-save logic |
| **Frontend / Editor Lead** | Jason C. | S2–S3 | Builder workspace (split-pane, ChatPanel, PreviewPanel), Tiptap/Monaco/Mermaid module editors, approve/reject UI |
| **Joinee / Publishing Lead** | Jason C. | S3–S4 | Publish flow, `/p/[slug]` Joinee view, localStorage progress, ProgressBar, ModuleList, code execution proxy |
| **QA / Testing Lead** | Jason C. | S4–S5 | Property tests (P1–P10), integration tests, Playwright smoke tests, accessibility audit, performance review |

Note: This is a solo-developer project. Jason owns all four roles sequentially across sprints, which is why the sprint assignments are staggered rather than parallel. The parallelization opportunities below apply if additional team members join.

**Parallelization opportunities**: In Sprint 2, the AI/Backend Lead can implement the `/api/ai/chat` route and session procedures while the Frontend Lead builds the workspace shell and ChatPanel UI. In Sprint 3, the Frontend Lead can implement module editors while the Joinee Lead starts the code execution proxy and Piston client.

## Contingency Plan

If the team falls behind schedule, the following Sprint 3 items can be deferred to MVP-plus without breaking the core flow:
- **Mermaid annotation interactivity** (hover/click tooltips) — diagrams still render, just without interactive annotations
- **Code execution proxy** (Piston integration) — the code editor still works for viewing/editing; the "Run" button shows a "coming soon" message
- **Property tests P5–P8** — these are marked optional (`*`) and can be written post-launch

Sprint 5 includes 2 days of contingency time (tasks 29–30) explicitly reserved for fixing integration issues discovered during end-to-end validation.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at the end of each sprint ensure incremental validation
- Property tests (P1–P10) use `fast-check` with a minimum of 100 iterations each and are tagged with `// Feature: onboarding-project-builder, Property N: ...`
- Unit tests and property tests are complementary — both are included
- Monaco Editor and Mermaid.js must be lazy-loaded to keep the initial bundle lean
- The Piston API URL is configurable via `PISTON_API_URL` env var to support self-hosting
