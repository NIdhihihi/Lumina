# Lumina AI — Academic Copilot: Engineering PRD (Repo-Grounded)

> This supersedes the original PRD's assumptions with what actually exists in
> `NIdhihihi/Lumina` today, audited directly from the repo on 2026-09-07.

## 0. Audit — Current State (ground truth)

**Stack confirmed:** Next.js 14 (App Router), React 18, TS, Tailwind, Zustand,
Recharts, pdfjs-dist, tesseract.js, socket.io. **No** DB, **no** vector store,
**no** LLM SDK, **no** `openai`/`@anthropic-ai/sdk` in `package.json`.

**Persistence:** `lib/storage.ts` — flat JSON files in `.lumina-data/*.json`
(`readJSON`/`writeJSON`). No database. No per-user scoping on data routes
(e.g. `app/api/attendance/route.ts` reads/writes one global `attendance.json`
regardless of who's logged in), even though `User`/`AuthSession` types and
`app/api/auth/route.ts` exist.

**Data model (`lib/types.ts`) — exists:** `Note` (+ `NoteAttachment` with
`textContent`), `Subject` (`attended`/`total`/`color`), `Task` (has
`attendancePercent`/`safeBunks` fields already, unused by any calc), `Expense`,
`CalendarEvent`, `ChatMessage`, `FocusSession`, `Alert`, `User`.

**Data model — does NOT exist:** no `Timetable`/`ClassSession` entity, no
`Exam` entity, no `AcademicContext` type. `CalendarEvent` is generic
(`event`/`task`/`reminder`) and can't represent a weekly recurring timetable.

**Current "AI" (`app/api/ai/chat/route.ts`):**
- Hardcoded to `http://localhost:11434/api/chat` (Ollama, model `llama3`).
  No env var, no provider abstraction, no cloud fallback — **this will not
  work on a judge's machine unless they install and run Ollama locally.**
- "RAG" is keyword overlap scoring across `notes.json` (title/content
  substring + keyword hits), picks top 3 notes, dumps raw text into the
  system prompt. No chunking, no embeddings, no vector search, no page-level
  citations — despite the system prompt literally telling the model to cite.
- No orchestrator, no tool calling, no intent detection, no deterministic
  attendance math — attendance-related answers would currently be fully
  LLM-hallucinated.
- `app/api/ai/extract-schedule/route.ts` exists (OCR/schedule extraction,
  not reviewed in depth here) — check before rebuilding timetable ingestion.

**Implication:** the original PRD's Phase-1 "audit existing repo" is done.
Sections 5 (context layer), 6 (provider layer), 7 (orchestrator), 8
(deterministic tools), 10–11 (real RAG) are **greenfield builds**, not
extensions of existing logic — the existing chat route should be treated as
a rough sketch to replace, not refactor in place.

---

## 1. Objective

Turn the existing `/ai` chat page from a single hardcoded local-LLM endpoint
into a context-aware Academic Copilot: real academic-context grounding, real
RAG over uploaded documents, deterministic attendance math, and lightweight
tool orchestration — demoable in 2–3 minutes without requiring the evaluator
to install anything locally.

## 2. Non-Goals

- No new database (stay on flat-JSON `.lumina-data/` — add new JSON files
  per new entity, following the existing `readJSON`/`writeJSON` pattern).
- No hosted vector DB / managed infra.
- No multi-user auth hardening beyond what's needed to not break the demo
  (flag the missing per-user scoping in README as a known limitation).
- No rewrite of Notes, Tasks, Expenses, Focus, Collaboration features.

## 3. New Data Model (add to `lib/types.ts`)

```ts
export interface ClassSession {
  id: string;
  subjectId: string;
  dayOfWeek: 0|1|2|3|4|5|6; // 0=Sunday
  startTime: string; // "14:00"
  endTime: string;
  location?: string;
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  date: string; // ISO
  weight?: "low"|"medium"|"high";
}

export interface AcademicContext {
  studentProfile: { name: string };
  subjects: Subject[];
  timetable: ClassSession[];
  exams: Exam[];
  tasks: Task[];
  notes: Note[]; // trimmed, no attachment blobs
  currentDate: string;
}
```

New storage files: `timetable.json`, `exams.json`. New CRUD routes:
`app/api/timetable/route.ts`, `app/api/exams/route.ts` (mirror the existing
`attendance/route.ts` pattern exactly — same GET/POST/PUT/DELETE shape).

## 4. AI Provider Layer (`lib/ai/provider.ts`)

Replace the hardcoded Ollama call. Must support:

- `AI_PROVIDER` = `anthropic` | `openai` | `ollama` (env-selected)
- `AI_API_KEY`, `AI_MODEL` — read server-side only, never exposed to client
- If `AI_PROVIDER=ollama`, keep current localhost behavior as a free local
  fallback (dev convenience) but it must **not** be the default for the
  demo build.
- Single exported function: `generateCompletion(messages, opts)` — every
  other module calls this, never a provider SDK directly.
- Graceful failure: if the key is missing/invalid, return a typed error the
  UI renders as a clear "AI unavailable" state — never a raw stack trace.

`.env.example`:
```
AI_PROVIDER=anthropic
AI_API_KEY=
AI_MODEL=claude-sonnet-4-6
EMBEDDING_PROVIDER=openai
EMBEDDING_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
```

## 5. Context Builder (`lib/ai/context.ts`)

`buildAcademicContext(intent, params)` — reads only the JSON files relevant
to the detected intent (attendance question → `attendance.json` +
`timetable.json` only; doesn't load notes/attachments). Replaces the
"just concatenate everything" style already latent in the chat route's
notes-dumping logic.

## 6. Deterministic Attendance Tools (`lib/ai/tools/attendance.ts`)

Pure TS functions, unit-tested, **LLM never does this math**:

```ts
function currentAttendancePercent(subject: Subject): number
function projectedAttendance(subject: Subject, missingClasses: number): number
function classesCanMiss(subject: Subject, targetPercent: number): number
function classesNeededToReachTarget(subject: Subject, targetPercent: number): number
function attendanceRiskLevel(percent: number, threshold: number): "safe"|"warning"|"critical"
```

The orchestrator calls these, then passes only the *result* to the LLM with
instructions to explain it in plain language — never to recompute it.

## 7. Orchestrator (`lib/ai/orchestrator.ts`)

Simple intent classification (regex/keyword rules first; LLM-based intent
tagging only as a fallback for ambiguous input — don't reach for an LLM call
to detect "attendance" in a message containing "attendance"):

| Intent | Tools invoked |
|---|---|
| Attendance question | `attendance.ts` + timetable lookup |
| Document question | `rag/retrieval.ts` |
| Study plan | timetable + tasks + exams + `rag/retrieval.ts` |
| Task priority | `tools/tasks.ts` |
| General | LLM only, no tools |

## 8. RAG Pipeline (real, not simulated)

- **Chunking** (`lib/ai/rag/chunking.ts`): split note/attachment
  `textContent` into ~500-token overlapping chunks, tagged with
  `{ noteId, attachmentName, chunkIndex, approxPage }`. `approxPage` can be
  estimated from `pdfjs-dist` page boundaries during extraction — don't
  invent exact page numbers you can't back up.
- **Embeddings** (`lib/ai/rag/embeddings.ts`): call the same provider
  abstraction pattern as §4 (cloud embeddings API by default; local
  fallback via `@xenova/transformers` if you want zero-API-key offline
  demo — pick one, document the choice, don't build both half-way).
- **Vector storage**: no new infra. Store `{ id, vector, metadata }` as a
  JSON array in `.lumina-data/vectors.json` (mirrors existing storage
  pattern) and do cosine similarity in-memory at query time. This is
  legitimate real retrieval, not a simulation — it's just an
  appropriately-sized index for a single-user local demo. Document this
  tradeoff explicitly in the README (§13 below) so it reads as a deliberate
  scoping decision, not an oversight.
- **Retrieval** (`lib/ai/rag/retrieval.ts`): embed the query, cosine-rank
  chunks, return top-k with metadata attached.
- Every document-grounded answer must render source chips (note title +
  approx page/section) distinct from the LLM's own explanation text —
  this is a UI requirement (`components/ai/SourceCitation.tsx`), not just a
  prompt instruction like the current implementation relies on.

## 9. Prompt Injection Guard

Wrap retrieved chunk text in a clearly delimited block in the system prompt
(e.g. `<<<RETRIEVED_DOCUMENT_CONTENT>>>...<<<END>>>`) with an explicit
instruction that content inside that block is data, never instructions.
Strip/flag chunks containing obvious instruction-like patterns
("ignore previous instructions", etc.) before they reach the prompt.

## 10. Study Planner & Task Prioritization

Both go through the orchestrator → provider layer, output validated against
a JSON schema (use `zod`) before touching the UI or `tasks.json`. Per
original spec: **never auto-write to `tasks.json`** — planner output is
shown for the user to accept, then written via the existing tasks route.

## 11. UI Work (`components/ai/`)

Extend the existing `app/(app)/ai/page.tsx` rather than rewriting it (it's
already 40KB — inventory what's reusable before touching it). Add:
`SourceCitation.tsx`, `AIRecommendation.tsx`, `StudyPlan.tsx`. Keep existing
suggested-prompts, loading/error states already present in that file if
they're functional.

## 12. Demo Flow (unchanged from original, now honest)

1. Dashboard — attendance, exams, tasks, AI recommendation (real data).
2. "Can I miss tomorrow's TOC lecture?" → timetable + attendance tools →
   deterministic projection → LLM explains.
3. Upload a policy PDF → "What's the minimum attendance requirement?" →
   real chunk retrieval → answer + source chip with page estimate.
4. "Create a study plan for my exams" → structured plan, requires
   confirm-to-save.
5. Brief architecture walkthrough.

## 13. README additions (be specific, not aspirational)

Document as explicit, named tradeoffs: JSON-file "vector store" instead of
a dedicated vector DB (why, and what you'd swap in at scale); no per-user
data scoping despite auth existing; Ollama kept only as an optional local
dev fallback, not the demo path.

## 14. Build Order

1. Add `ClassSession`/`Exam` types + CRUD routes (mirror `attendance/route.ts`).
2. Provider abstraction + `.env.example` (kill the Ollama hardcode as default).
3. Deterministic attendance tools + unit tests.
4. Context builder.
5. Chunking + embeddings + JSON vector store + retrieval.
6. Orchestrator (intent → tools).
7. Rewire `app/api/ai/chat/route.ts` to call the orchestrator instead of
   Ollama directly.
8. Study planner + task prioritization (schema-validated).
9. UI: source citations, recommendations, study plan components.
10. Demo dataset + README.

## 15. Acceptance Criteria (trimmed to what's actually checkable)

- [ ] Chat works against a cloud provider with no local install required
- [ ] Attendance math is 100% deterministic TS, covered by unit tests
- [ ] Uploading a doc → asking about it returns an answer with a real
      source chip (not just a prompt claim)
- [ ] Study plan / task priority output is schema-validated JSON
- [ ] No API key in any client bundle or committed file
- [ ] README's RAG/vector-store section matches what's actually implemented
