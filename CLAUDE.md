# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup
npm run setup          # install + prisma generate + migrate

# Development
npm run dev            # Next.js dev server with Turbopack
npm run dev:daemon     # Background dev server, logs to logs.txt

# Build & production
npm run build
npm run start

# Testing
npm run test           # Vitest (watch mode)
npx vitest run         # Single test run
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx  # Single file

# Linting
npm run lint           # ESLint via Next.js

# Database
npx prisma migrate dev   # Apply migrations
npm run db:reset         # Reset database (destructive)
npx prisma studio        # GUI for database
```

## Architecture

UIGen is an AI-powered React component generator. Users describe UI in chat; Claude generates JSX files that render live in a sandboxed iframe.

### Data Flow

```
User Chat → ChatContext (useChat) → POST /api/chat
                                          ↓
                                    streamText() + tools
                                          ↓
                              str_replace_editor / file_manager
                                          ↓
                              FileSystemContext (in-memory VFS)
                                          ↓
                         PreviewFrame (Babel transpile + iframe render)
                         CodeEditor (Monaco display)
```

### Key Abstractions

**Virtual File System** (`src/lib/file-system.ts`): In-memory file tree with no disk I/O. Serializes to JSON for DB persistence. All AI-generated files live here.

**Provider** (`src/lib/provider.ts`): Abstraction over `@ai-sdk/anthropic`. If `ANTHROPIC_API_KEY` is set, uses real Claude; otherwise falls back to `MockLanguageModel` that returns static component sequences for demo/dev use.

**AI Route** (`src/app/api/chat/route.ts`): The core agentic loop. Receives messages + serialized file system, runs `streamText()` with up to 40 tool-use steps. Tools: `str_replace_editor` (view/create/edit files) and `file_manager` (CRUD on file tree). Saves project state to DB on completion.

**Contexts**: Two React contexts wire everything together:
- `FileSystemContext` — VFS state + handles tool call results from AI
- `ChatContext` — wraps `useChat`, sends VFS state in each request body, routes tool results back to file system

**Preview** (`src/components/preview/PreviewFrame.tsx`): Transpiles JSX with Babel Standalone in the browser, creates an import map, and renders in a sandboxed iframe. Auto-detects entry point (App.jsx, index.jsx, etc.).

### Auth

JWT sessions (7-day, httpOnly cookie). `src/lib/auth.ts` for session helpers, `src/actions/index.ts` for sign-up/sign-in server actions, `src/middleware.ts` protects API routes. Anonymous users can use the app; projects are not persisted unless signed in.

### Database

Prisma + SQLite (`prisma/dev.db`). The schema is at `src/generated/prisma/schema.prisma` — reference it to understand the data model. Two models: `User` and `Project`. Projects store `messages` and `data` (file system) as JSON strings. Cascade-delete on user removal.

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `ANTHROPIC_API_KEY` | No | Falls back to mock provider if absent |
| `JWT_SECRET` | No | Defaults to `development-secret-key` |

## Testing

Tests are colocated in `__tests__/` subdirectories. Uses Vitest + React Testing Library + jsdom. Existing tests cover chat components and markdown rendering.

## Code Style

Use comments sparingly. Only comment complex code.

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (new-york style, neutral base)
- Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) for streaming + tool use
- Monaco Editor for code display, Babel Standalone for in-browser JSX transpilation
- Prisma ORM + SQLite
