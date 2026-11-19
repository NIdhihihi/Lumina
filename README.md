# Lumina — Academic Copilot

Lumina is a Next.js academic productivity app with a context-aware AI copilot. It combines deterministic attendance math, JSON-backed storage, and real embedding-based retrieval over uploaded note content.

## Quick start

1. Copy `.env.example` to `.env.local` and set your provider keys:

```bash
# Optional cloud LLM (defaults to on-device offline Basement Shield if omitted)
AI_PROVIDER=anthropic
AI_API_KEY=your_key_here
AI_MODEL=claude-sonnet-4-6

# Embeddings run on-device via TensorFlow.js by default (100% offline & private)
EMBEDDING_PROVIDER=local
```

2. Install and run:

```bash
pnpm install
pnpm dev
```

3. Open `/rag` for the AI copilot or `/` for the dashboard demo data.

## Demo flow

1. Dashboard shows attendance, tasks, schedule, and a recommendation.
2. Ask: **"Can I miss tomorrow's TOC lecture?"** → timetable + deterministic attendance projection.
3. Ask: **"What's the minimum attendance requirement?"** → real chunk retrieval from the policy note + source chips.
4. Ask: **"Create a study plan for my exams"** → schema-validated JSON plan with confirm-to-save.
5. Ask: **"Which tasks should I prioritize this week?"** → ranked task list.

## Architecture

| Layer | Location | Purpose |
|---|---|---|
| Storage | `server/db.ts`, `data/*.json` | Flat JSON persistence |
| Provider | `lib/ai/provider.ts` | Anthropic / OpenAI / Ollama abstraction |
| Context | `lib/ai/context.ts` | Intent-scoped academic context loading |
| Tools | `lib/ai/tools/*` | Deterministic attendance + task ranking |
| RAG | `lib/ai/rag/*` | Chunk → embed → cosine search |
| Orchestrator | `lib/ai/orchestrator.ts` | Intent → tools → LLM explanation |
| API | `app/api/ai/chat/route.ts` | Chat entry point |

## Deliberate tradeoffs

### JSON-file vector store (not a vector DB)

Embeddings are stored in `data/vectors.json` as `{ id, vector, metadata }[]`. Retrieval runs in-memory cosine similarity at query time.

**Why:** zero extra infra for a single-user local demo.

**At scale:** swap `lib/ai/rag/vector-store.ts` for Pinecone, pgvector, or Qdrant; keep the same retrieval interface.

### No per-user data scoping

Auth/types exist in the broader product vision, but API routes read/write global JSON files (`attendance.json`, `notes.json`, etc.) regardless of who is logged in.

**Known limitation:** do not use this storage model for multi-tenant production without adding user-scoped paths or a database.

### Ollama is dev-only fallback

`AI_PROVIDER=ollama` keeps local development possible, but the demo path expects a cloud provider (`anthropic` or `openai`) so evaluators do not need local model installs.

## Attendance math

All attendance calculations live in `lib/ai/tools/attendance.ts` and are covered by Vitest unit tests. The LLM receives computed results and explains them — it never recalculates percentages.

```bash
pnpm test
```

## RAG pipeline

1. Notes (and attachment `textContent`) are chunked in `lib/ai/rag/chunking.ts`.
2. Chunks are embedded via on-device TensorFlow.js embeddings by default (`EMBEDDING_PROVIDER=local`), guaranteeing offline privacy in basement lecture halls. Cloud OpenAI embeddings can optionally be configured via `EMBEDDING_PROVIDER=openai`.
3. Vectors persist to `data/vectors.json`.
4. Queries embed the user message, rank chunks by cosine similarity, and wrap retrieved text in `<<<RETRIEVED_DOCUMENT_CONTENT>>>` delimiters with injection-pattern filtering.

Re-index all notes:

```bash
curl -X POST http://localhost:3000/api/ai/index
```

## Environment variables

See `.env.example` for the full list. API keys are server-side only and must never be committed or exposed to client bundles.

## New entities

- `ClassSession` → `data/timetable.json` via `/api/timetable`
- `Exam` → `data/exams.json` via `/api/exams`

Types are defined in `lib/types.ts`.
