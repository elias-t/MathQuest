# MathQuest — Project Context for Claude

## Project Overview
MathQuest is an adaptive maths tutoring platform for children. It consists of three services:

```
MathQuest/
├── api/          ← NestJS REST API (TypeScript)
├── ai-service/   ← Python FastAPI AI service
├── frontend/     ← React + Vite frontend
├── postman/      ← API collections
└── docker-compose.yml
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
| ProblemsModule | `src/problems/` | CRUD for problems + AI hint endpoint |
| SubmissionsModule | `src/submissions/` | Student answer submission + teacher view |
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
| GET | `/problems` | JWT | List all problems |
| GET | `/problems/:id` | JWT | Get single problem |
| POST | `/problems` | TEACHER | Create problem |
| PATCH | `/problems/:id` | TEACHER + owner | Update problem |
| DELETE | `/problems/:id` | TEACHER + owner | Delete problem |
| POST | `/problems/:id/hint` | JWT | Get AI hint for problem |
| POST | `/submissions` | STUDENT | Submit answer |
| GET | `/submissions/my` | STUDENT | My submission history |
| GET | `/submissions/problem/:id` | TEACHER + owner | All submissions for a problem |

**AuthModule (`src/auth/`)**
- `POST /auth/register` — hashes password with bcrypt (10 rounds), creates user, returns `{ token }`
- `POST /auth/login` — verifies bcrypt hash, returns `{ token }`
- JWT payload: `{ sub: userId, email, role }` — expires in 7 days
- `JwtStrategy.validate()` maps payload to `{ userId, email, role }` on `req.user`
- `AuthModule` exports `PassportModule` so other modules that import it can resolve `JwtAuthGuard`

**ProblemsModule (`src/problems/`)**
- `findAll()` — includes `createdBy` user
- `findOne(id)` — includes `createdBy` user, throws `NotFoundException`
- `create(dto, userId)` — sets `createdById` to calling user's ID
- `update(id, dto, userId)` — verifies ownership, throws `ForbiddenException` if not owner
- `remove(id, userId)` — verifies ownership, throws `ForbiddenException` if not owner
- `getHint(problemId, previousHints)` — calls `AiService.getHint`, throws `ServiceUnavailableException` if AI returns null
- Imports: `PrismaModule`, `AuthModule`, `AiModule`

**SubmissionsModule (`src/submissions/`)**
- `create(dto, studentId)` — calls AI validation first; if AI fails falls back to case-insensitive string compare; stores `aiFeedback` from AI response; counts prior attempts to set `attemptNumber`
- `findMySubmissions(studentId)` — includes `problem.title` and `problem.topic`, ordered by `createdAt desc`
- `findByProblem(problemId, teacherId)` — verifies teacher owns the problem, includes `student.displayName` and `student.email`
- Imports: `PrismaModule`, `AuthModule`, `AiModule`

**AiModule (`src/ai/`)**
- `validateAnswer(problem, studentAnswer, correctAnswer)` → `POST /validate` on Python service
- `getHint(problem, correctAnswer, previousHints)` → `POST /hint` on Python service
- Both return `null` on failure (graceful fallback)
- URL configured via `AI_SERVICE_URL` env var (default: `http://localhost:8000`)
- `AiModule` exports `AiService` — imported by both `ProblemsModule` and `SubmissionsModule`

**Prisma schema key models:**
- `User`: id, email, password, displayName, role (String), teacherId (self-relation)
- `Problem`: id, title, description, topic, difficulty (Int), ageGroup, correctAnswer, hints, createdById
- `Submission`: id, answer, isCorrect, timeTaken, aiFeedback, hintsUsed, attemptNumber, studentId, problemId

### Difficulty Levels (1-10)

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
- Claude uses these levels when reasoning about appropriate next problems
- The RAG recommender favours small upward steps (e.g. 2 → 3) when a student succeeds, and drops back down (e.g. 5 → 3) when they struggle

---

## ai-service/ — Python FastAPI

**Stack:** FastAPI, Anthropic SDK, ChromaDB, uvicorn

**Entry point:** `ai-service/app/main.py` — listens on port 8000

**Structure:**
```
ai-service/
├── chroma_client.py         ← ChromaDB singleton (PersistentClient, "problems" collection)
├── app/
│   ├── main.py              ← FastAPI app, routers registered here
│   ├── models/schemas.py    ← All Pydantic request/response models
│   └── routers/
│       ├── validation.py    ← POST /validate
│       ├── hints.py         ← POST /hint
│       └── rag.py           ← POST /rag/index, POST /rag/recommend
└── rag/
    ├── ingest.py            ← index_problem() — upserts into ChromaDB
    ├── retrieval.py         ← query_problems() — semantic search by topic
    ├── prompts.py           ← build_recommendation_prompt()
    └── chains.py            ← recommend_next_problem() — orchestrates RAG + Claude
```

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/validate` | Validates student answer using Claude tool use |
| POST | `/hint` | Generates progressive hint using Claude tool use |
| POST | `/rag/index` | Indexes a problem into ChromaDB |
| POST | `/rag/recommend` | Recommends next problem based on student performance |

**All Claude calls use tool use** (`tool_choice: {"type": "tool", "name": "..."}`) for structured output. Model: `claude-sonnet-4-20250514`.

**RAG recommendation flow:**
1. Find weakest topic (lowest `correct/total` ratio from `topic_performance`)
2. Query ChromaDB for up to 5 semantically similar problems on that topic
3. Exclude `last_problem_id` to avoid repetition
4. Claude picks best problem via `recommend_problem` tool
5. Returns `{ problem_id, title, topic, difficulty, reasoning }`

**ChromaDB:**
- Persistent storage in `./chroma_data`
- Collection: `"problems"` with `DefaultEmbeddingFunction` (all-MiniLM-L6-v2)
- Metadata stored per problem: `problem_id`, `title`, `topic`, `difficulty`
- `retrieval.py` guards against empty collection before querying

**Key schemas (`app/models/schemas.py`):**
- `ValidateRequest`: `problem`, `student_answer`, `correct_answer`
- `HintRequest`: `problem`, `correct_answer`, `previous_hints: list[str] = []`
- `IndexRequest`: `problem_id`, `title`, `description`, `topic`, `difficulty`
- `RecommendRequest`: `student_id`, `topic_performance: list[TopicPerformance]`, `last_problem_id?`

---

## System Flows

### Teacher Creates a Problem
```
POST /problems (NestJS)
│
├── 1. ProblemsService.create() saves problem to PostgreSQL
│
└── 2. void aiService.indexProblem()  ← fire & forget, does not block response
        │
        └── POST /rag/index (FastAPI)
                │
                └── ingest.index_problem()
                        └── ChromaDB upserts problem as vector
```

### Student Submits an Answer
```
POST /submissions (NestJS)
│
├── 1. aiService.validateAnswer() → POST /validate (FastAPI + Claude)
│       └── Falls back to string comparison if AI unavailable
│
├── 2. Saves submission to PostgreSQL
│
├── 3. Fetches all student submissions → builds topicPerformance[]
│       └── { topic, correct, total } grouped by topic
│
└── 4. aiService.getRecommendation() → POST /rag/recommend (FastAPI)
        │
        └── chains.recommend_next_problem()
                │
                ├── 1. Find weakest topic (lowest correct/total ratio)
                │
                ├── 2. retrieval.query_problems(weakest_topic)
                │       └── ChromaDB semantic search → up to 5 candidates
                │
                ├── 3. Filter out last_problem_id to avoid repetition
                │
                ├── 4. prompts.build_recommendation_prompt()
                │       └── Formats performance + candidates into prompt
                │
                └── 5. Claude API (tool use: recommend_problem)
                        └── Returns { problem_id, title, topic, difficulty, reasoning }
```

Response to student includes `{ ...submission, recommendation }` — `recommendation` is `null` if RAG unavailable.

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
```

---

## Key Conventions

- NestJS role checks are inline in controllers (`if (req.user.role !== 'TEACHER')`)
- Ownership checks (update/delete) are in the service layer
- AI service failures are silent — NestJS falls back gracefully (null check → string comparison for submissions, 503 for hints)
- ChromaDB uses `upsert` not `add` — safe to re-index problems
- Python imports run from `ai-service/` as working directory (`from chroma_client import ...`, `from rag.chains import ...`)
