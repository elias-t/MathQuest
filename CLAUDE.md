# MathQuest — Project Context for Claude

## Project Overview

MathQuest is an adaptive maths tutoring platform for children. It consists of three services:

```
MathQuest/
├── api/          ← NestJS REST API (TypeScript)
├── ai-service/   ← Python FastAPI AI service
├── frontend/     ← React + Vite frontend (in development)
├── postman/      ← API collections
└── docker-compose.yml
```

The pedagogical model is an **adaptive loop**: on each submission, NestJS decides — based on the result and attempt count — whether to advance the student (harder problem), scaffold them down (decompose the problem they got wrong), or hold them on the current problem (more hints). All "next problems" are AI-generated, sympy-verified, and persisted as real Problem rows.

---

## Running the Services

Run each in its own terminal (PowerShell). Start order: **ai-service → api → frontend** (the API tolerates the AI service being down, but the frontend fetches from the API on load).

**ai-service** — Python FastAPI, port 8000. From `ai-service/`:
```powershell
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**api** — NestJS, port 3000. From `api/`:
```powershell
npm run start:dev
```

**frontend** — React + Vite, port 5173. From `frontend/`:
```powershell
npm run dev
```

---

## api/ — NestJS Backend

**Stack:** NestJS, Prisma, PostgreSQL, Passport JWT

**Entry point:** `api/src/main.ts` — listens on port 3000

**Modules:**

| Module | Path | Description |
|--------|------|-------------|
| AuthModule | `src/auth/` | JWT register/login, JwtStrategy, JwtAuthGuard |
| PrismaModule | `src/prisma/` | Global Prisma service (@Global) |
| ProblemsModule | `src/problems/` | CRUD for problems, AI hint endpoint, AI generation endpoint |
| SubmissionsModule | `src/submissions/` | Student answer submission — auto-triggers generation |
| AiModule | `src/ai/` | HTTP client to Python AI service |

**Auth pattern:**
- JWT stored as Bearer token
- `req.user` contains `{ userId, email, role }` (set by `JwtStrategy.validate`)
- Role values: `"TEACHER"` | `"STUDENT"` (plain strings, not enum)
- Teacher-only routes check `req.user.role !== 'TEACHER'` and throw `ForbiddenException`

**API routes:**

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register user |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/auth/me` | JWT | Get current user |
| GET | `/problems` | JWT | List all problems (teacher view) |
| GET | `/problems/student` | STUDENT | Problems visible to the caller (teacher problems + own AI problems) with per-student `status`. **Must be declared before `/problems/:id`** or the router captures it as `id="student"`. |
| GET | `/problems/:id` | JWT | Get single problem |
| POST | `/problems` | TEACHER | Create problem (include `machineForm` + `variable` for equations) |
| PATCH | `/problems/:id` | TEACHER + owner | Update problem |
| DELETE | `/problems/:id` | TEACHER + owner | Delete problem |
| POST | `/problems/:id/hint` | JWT | Get AI hint for problem |
| POST | `/problems/:id/generate-next` | JWT | Generate next problem (`direction` = harder \| easier \| scaffold) — **persists the result** |
| POST | `/submissions` | STUDENT | Submit answer — response includes `nextProblem` when applicable |
| GET | `/submissions/my` | STUDENT | My submission history |
| GET | `/submissions/problem/:id` | TEACHER + owner | All submissions for a problem |

**AiService (`src/ai/ai.service.ts`):**

| Method | Purpose | Python endpoint |
|--------|---------|-----------------|
| `validateAnswer(problem, studentAnswer, correctAnswer)` | AI answer validation | POST `/validate` |
| `getHint(problem, correctAnswer, previousHints)` | Progressive hint generation | POST `/hint` |
| `indexProblem(id, title, description, topic, difficulty)` | Index a problem into ChromaDB | POST `/rag/index` |
| `getRecommendation(topicPerformance, lastProblemId)` | RAG recommendation **(parked — no longer called from submissions)** | POST `/rag/recommend` |
| `generateNext(solvedProblem, solvedMachineForm, variable, topic, difficulty, direction)` | Generate next adaptive problem | POST `/generate-next` |

All methods log and return `null`/`void` on failure (graceful fallback).
URL configured via `AI_SERVICE_URL` env var (default: `http://localhost:8000`).

**ProblemsService key methods:**

- `create(...)` — saves problem, fires `indexProblem()` (fire-and-forget)
- `generateAndPersist(sourceProblemId, direction, studentId)` — calls AI generation, persists result as a new Problem row with `aiGenerated=true`, inherits `createdById` from source, **stamps `generatedForId=studentId`** (the owning student), and indexes the new problem into ChromaDB
- `findAllForStudent(studentId)` — returns problems visible to one student (`aiGenerated=false` OR `generatedForId=studentId`), each with a computed per-student `status` derived from that student's own submissions: `NOT_ATTEMPTED` | `ATTEMPTED` | `SOLVED_FIRST_TRY` | `SOLVED_LATER`

**SubmissionsService.create() flow:**

```
1. Find source problem
2. AI-validate answer (fallback to string comparison if AI down)
3. Count previousAttempts AND priorCorrect (both BEFORE creating this submission)
4. Save submission with attemptNumber (= previousAttempts + 1)
5. Decide direction (GENERATION is gated, submissions are always kept):
     isCorrect && priorCorrect === 0      → "harder"   (only the FIRST solve)
     !isCorrect && attemptNumber === 3    → "scaffold"  (exactly once, on 3rd miss)
     otherwise                            → no direction (no nextProblem)
6. If direction set: nextProblem = await problemsService.generateAndPersist(problemId, direction, studentId)
7. Return { ...submission, nextProblem | null }
```

⚠️ The gate is on **generation, not submission** — re-submitting a correct answer still records the attempt but does NOT spawn a duplicate AI problem. `priorCorrect === 0` prevents duplicate "harder" problems; `attemptNumber === 3` (strict) prevents runaway scaffolds on the 4th, 5th… miss.

**Prisma schema key models:**

- `User`: id, email, password (bcrypt-hashed — **must be excluded from API responses**), displayName, role (String), teacherId (self-relation), **generatedProblems (Problem[] via `@relation("GeneratedProblems")`)**
- `Problem`: id, title, description, topic, difficulty (Int 1-10), ageGroup, correctAnswer, hints, createdById, **aiGenerated (Boolean, default false)**, **machineForm (String?)**, **variable (String?)**, **generatedForId (String?)** — the owning student for AI-generated problems (NULL for teacher-authored problems and pre-migration rows); relation `generatedFor` via `@relation("GeneratedProblems")`, named distinctly from the `TeacherProblems` relation
- `Submission`: id, answer, isCorrect, timeTaken, aiFeedback, hintsUsed, attemptNumber, studentId, problemId

✅ **`password` can never be returned.** A **global Prisma omit** (`omit: { user: { password: true } }` in `prisma.service.ts`, via the `omitApi` preview feature) strips it from every User query result — including nested includes — at the client level, and removes it from the result *types* (reading `.password` is a compile error). The single opt-back-in is the login bcrypt compare in `auth.service.ts` (`omit: { password: false }`). Existing per-query `select`s still apply on top.

---

## ai-service/ — Python FastAPI

**Stack:** FastAPI, Anthropic SDK, ChromaDB, sympy, uvicorn

**Entry point:** `ai-service/app/main.py` — listens on port 8000

**Structure:**

```
ai-service/
├── chroma_client.py         ← ChromaDB singleton ("problems" collection)
├── app/
│   ├── main.py              ← FastAPI app, routers registered here
│   ├── models/schemas.py    ← Pydantic request/response models
│   ├── routers/
│   │   ├── validation.py    ← POST /validate
│   │   ├── hints.py         ← POST /hint
│   │   ├── rag.py           ← POST /rag/index, POST /rag/recommend   (parked)
│   │   └── generation.py    ← POST /generate-next                    (active)
│   └── services/
│       ├── ai_validator.py  ← validate_answer() — Claude call (VALIDATOR_MODEL)
│       └── ai_hint.py        ← generate_hint()   — Claude call (HINT_MODEL)
├── rag/                     ← parked — code intact, not invoked from submissions
│   ├── ingest.py            ← index_problem()
│   ├── retrieval.py         ← query_problems()
│   ├── prompts.py           ← build_recommendation_prompt()
│   └── chains.py            ← recommend_next_problem()
└── generation/              ← AI problem generation, sympy-verified
    ├── generator.py         ← GENERATE_TOOL + generate_problem() + direction guidance
    └── verify.py            ← verify() + solution_preserved()
```

**Endpoints:**

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| POST | `/validate` | active | Validates student answer using Claude tool use |
| POST | `/hint` | active | Generates progressive hint using Claude tool use |
| POST | `/rag/index` | active | Indexes a problem into ChromaDB |
| POST | `/rag/recommend` | parked | Returns recommended next problem (legacy — not used by submissions) |
| POST | `/generate-next` | active | Generates a calibrated next problem (harder/easier/scaffold) |

**All Claude calls use tool use** (`tool_choice: {"type": "tool", "name": "..."}`) for structured output. Each call site reads its model from a **per-purpose env var** (see Environment Variables): `HINT_MODEL` (default `claude-haiku-4-5`), `VALIDATOR_MODEL`, `GENERATOR_MODEL`, `RECOMMEND_MODEL` (default `claude-sonnet-4-6`). The retired `claude-sonnet-4-20250514` has been removed from the codebase.

### Generation flow (`/generate-next`)

```
1. Build prompt with direction-specific guidance + VALID/INVALID examples
2. (scaffold only) solve the original equation via sympy → assert target answer
3. Call Claude with GENERATE_TOOL (forced tool use)
4. verify(result) — sympy independently solves machine_form
                    and confirms it matches correct_answer
5. (scaffold only) solution_preserved() — sympy confirms generated
                    machine_form solves to the SAME value as the original
6. Retry up to 3 times; HTTP 422 if no attempt passes verification
```

**Direction semantics** (see `_DIRECTION_GUIDANCE` in `generation/generator.py`):

| Direction | Pedagogical meaning |
|-----------|---------------------|
| `harder`  | Introduce ONE new technique (combine like terms, distribution, variable on both sides). Difficulty +1. |
| `easier`  | REMOVE one technique (reduce a multi-step equation to one-step). Difficulty -1. |
| `scaffold`| Apply ONE solving step to the failed problem (e.g. `3x+2=8` → `3x=6`). Same solution preserved. Difficulty -1. |

Each direction's prompt includes explicit `VALID:` / `INVALID:` examples. Without these, Claude defaults to surface-level "harder = bigger numbers" / "easier = smaller numbers" — pedagogical progression requires the examples.

**Difficulty is computed deterministically in NestJS** (`source.difficulty ± 1`, clamped 1-10) — Claude unreliably moves the number itself.

### RAG flow (parked)

The RAG endpoints remain functional but **are no longer called from the submission flow** — generation replaces the recommendation role. ChromaDB is still indexed on every problem create (including AI-generated ones), keeping the option open for future natural-language search.

**Reserved for:** future "I'm confused about X" natural-language search across the problem bank — the one use case where semantic similarity genuinely beats a `WHERE` clause, because the input is freeform language with no structured columns to filter by.

### ChromaDB

- Persistent storage in `./chroma_data`
- Collection: `"problems"` with `DefaultEmbeddingFunction` (all-MiniLM-L6-v2)
- Metadata per problem: `problem_id`, `title`, `topic`, `difficulty`
- `upsert` is used (not `add`) — safe to re-index
- `retrieval.py` guards against empty collection

**Known dev gotcha:** repeated creation of identical problems can leave stale duplicates. If recommendations start saying "all candidates are identical," reset the store:
```powershell
Remove-Item -Recurse -Force ai-service\chroma_data
```

### Key schemas (`app/models/schemas.py`):

- `ValidateRequest`: `problem`, `student_answer`, `correct_answer`
- `HintRequest`: `problem`, `correct_answer`, `previous_hints: list[str] = []`
- `IndexRequest`: `problem_id`, `title`, `description`, `topic`, `difficulty`
- `RecommendRequest`: `student_id`, `topic_performance: list[TopicPerformance]`, `last_problem_id?`
- `GenerateRequest`: `solved_problem`, `solved_machine_form = ""`, `variable = ""`, `topic`, `difficulty`, `direction = "harder"`
- `GenerateResponse`: `description`, `machine_form`, `problem_type`, `variable`, `correct_answer`, `difficulty`, `solution_steps`, `new_skill`

---

## Environment Variables

**api/.env**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
AI_SERVICE_URL=http://localhost:8000
```

**ai-service/.env**
```
ANTHROPIC_API_KEY=...
HINT_MODEL=claude-haiku-4-5
VALIDATOR_MODEL=claude-sonnet-4-6
GENERATOR_MODEL=claude-sonnet-4-6
RECOMMEND_MODEL=claude-sonnet-4-6
```
Model vars are optional — each call site falls back to the defaults above if unset. `chroma_data/` is gitignored (runtime state, regenerated on startup).

---

## Difficulty Levels (1-10)

| Level | Label | Description | Example |
|-------|-------|-------------|---------|
| 1 | Foundational | Single-step recall, direct facts | 5 + 3 = ? |
| 2 | Easy | Single operation, slightly larger numbers | 6 × 4 = ? |
| 3 | Moderate | Two-step or introductory abstract concepts | Solve 2x + 4 = 10 |
| 4 | Building | Multi-step with multiple operations | Solve 5x - 3 = 12 |
| 5 | Medium | Mixed operations, word problems | If 3 apples cost £4.50, how much for 7? |
| 6 | Challenging | Multi-concept problems | Solve 2(x + 3) = 5x - 4 |
| 7 | Hard | Advanced application | Quadratic equations |
| 8 | Advanced | Combines several topics | Systems of equations |
| 9 | Expert | Requires deep reasoning | Proofs, complex word problems |
| 10 | Mastery | Olympiad-level | Multi-step abstract reasoning |

**Conventions:**
- New problems default to difficulty 1-3 unless explicitly testing advanced skills
- The generation engine adjusts difficulty deterministically (+1/-1) when stepping
- Claude uses these levels as context, but NestJS — not Claude — sets the final stored difficulty

---

## Key Conventions

- NestJS role checks are inline in controllers (`if (req.user.role !== 'TEACHER')`)
- Ownership checks (update/delete) are in the service layer
- AI service failures are silent — NestJS falls back gracefully (`null` checks, string comparison for submissions, 503 for hints, null `nextProblem` for generation)
- ChromaDB uses `upsert` not `add` — safe to re-index problems
- Python imports run from `ai-service/` as working directory (`from chroma_client import ...`, `from rag.chains import ...`, `from generation.generator import ...`)
- **All Claude calls use tool use** (`tool_choice: {"type": "tool", "name": "..."}`) for structured output. Each call site reads its model from a per-purpose env var (`HINT_MODEL`, `VALIDATOR_MODEL`, `GENERATOR_MODEL`, `RECOMMEND_MODEL`) — no longer a single shared string.
- **AI prompts requiring precise behaviour** (especially `generation/generator.py` direction guidance) MUST include explicit `VALID:` / `INVALID:` examples. Without them, Claude defaults to surface-level interpretation (numerical scaling instead of pedagogical scaling).
- **The validator must NOT reveal the answer on a wrong submission** — `ai_validator.py`'s prompt and the `feedback` tool-field description both forbid stating the correct answer or solution steps when the student is incorrect; feedback is a nudge toward the approach only. (Correct answers may reference the value.)
- **Generated problems are persisted** with `aiGenerated=true`, inherit `createdById` from their source, and are indexed into ChromaDB on save.
- **Difficulty stepping is deterministic in NestJS** (`±1`, clamped 1-10) — never trust the model's difficulty field.
- **Sympy verification** runs in `generation/verify.py`. `verify()` checks the generated problem is internally consistent; `solution_preserved()` (scaffold only) checks the generated equation solves to the same value as the original.
- **`password` is excluded globally** via Prisma's `omit` in `prisma.service.ts` — new User-returning queries are safe by default, no `select` required for this. Only login opts back in (`omit: { password: false }`). Don't remove the `omitApi` preview flag from `schema.prisma` — the guard depends on it until Prisma is upgraded to 6+ (where it's GA).

---

## RAG: Parked, Not Removed

RAG (ChromaDB + semantic recommendation) was implemented end-to-end and remains functional, but is **no longer wired into the submission flow** — generation replaced it. Code, endpoints, and indexing remain intact.

**Why parked:** for the recommend-next-problem use case, RAG's semantic search was constrained by topic filters to the point where a plain SQL query did the same job more transparently. Generation produces calibrated problems on demand, which is a genuinely AI-shaped task that retrieval can't do.

**Where RAG will return:** a future natural-language feature ("I'm confused about X" search across the problem bank) — the one use case where embeddings genuinely beat a `WHERE` clause, because the input is freeform language with no structured columns to filter by.

---

## Parked for Phase 3

- **Word problems** — schema would extend via a `problemType` field; RAG becomes genuinely useful for retrieving conceptually similar word problems where topic tags are too coarse.
- **LangGraph** — reserved for an agentic Phase 3 (multi-step reasoning across tools: tutor + setter + verifier + planner). Current single-shot tool-use calls don't need a framework.
- **Azure AI Search** — migration target when moving beyond local ChromaDB. The vector store interface is small enough to swap cleanly.
- **History-aware hints** — RAG-based: retrieve problems the student solved correctly that are similar to the one they're stuck on, ground the hint in that prior success.