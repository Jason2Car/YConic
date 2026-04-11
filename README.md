# Onboarding Project Builder

AI-powered tool for creating interactive onboarding experiences. Designers chat with an AI assistant to build structured modules (rich text, Mermaid diagrams, code exercises) that are published as shareable, account-free URLs for new team members.

## Tech Stack

- **Next.js 14** (App Router) — full-stack React framework
- **TypeScript** — end-to-end type safety
- **Tailwind CSS + Radix UI** — styling and accessible primitives
- **xAI Grok-4** via Vercel AI SDK — structured AI output with Zod validation
- **Prisma + Neon PostgreSQL** — serverless database with connection pooling
- **Monaco Editor** — VS Code-grade code editing
- **Tiptap** — rich text editing
- **Mermaid.js** — interactive diagram rendering
- **Zustand** — lightweight client state management

## Prerequisites

- Node.js 18+
- npm 9+
- A [Neon](https://neon.tech) PostgreSQL database
- An [xAI](https://x.ai) API key

## Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `XAI_API_KEY` — xAI API key for Grok-4

3. Run database migrations:

```bash
npx prisma migrate dev --name init
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) — you'll land on the dashboard.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # REST API endpoints
│   │   ├── ai/chat/        # AI chat with structured Zod output
│   │   ├── projects/       # Project CRUD
│   │   ├── modules/        # Module CRUD
│   │   └── execute/        # Code execution proxy (Piston)
│   ├── dashboard/          # Project list and creation
│   ├── builder/            # Designer workspace (edit stage)
│   └── p/[slug]/           # Joinee public view (no auth required)
├── components/
│   ├── editor/             # Builder workspace UI (VS Code-inspired)
│   ├── modules/            # Module type editors (Tiptap, Monaco, Mermaid)
│   └── preview/            # Joinee-facing read-only renderers
├── lib/
│   ├── ai/                 # AI prompts and Zod schemas
│   ├── store/              # Zustand stores (project, editor, chat)
│   └── progress.ts         # Joinee localStorage progress utilities
└── server/db/              # Prisma client singleton (Neon adapter)
```

## Key Features

- **Three-stage workflow**: Init → Intro → Edit
- **AI chat**: Natural language instructions produce structured module changes validated by Zod
- **Three module types**: Rich text (Tiptap), interactive diagrams (Mermaid), code exercises (Monaco)
- **Publish & share**: Generate a unique URL; Joinees access without creating an account
- **Progress tracking**: Joinees mark modules complete; progress persists in localStorage
