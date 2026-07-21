# MathQuest

An adaptive maths tutoring platform for children. Every submission drives an AI-generated, sympy-verified next problem — harder when a student succeeds, scaffolded when they're stuck.

## How it works

On each submission, the API decides — based on correctness and attempt count — whether to advance the student to a harder problem, scaffold them down (decompose the one they got wrong into an easier step), or just hold them on the current problem for more hints. Generated problems are produced by Claude, independently verified with `sympy`, and persisted as real problem rows owned by the student they were generated for.

```
MathQuest/
├── api/          ← NestJS REST API (TypeScript, Prisma, PostgreSQL)
├── ai-service/   ← Python FastAPI AI service (Claude, ChromaDB, sympy)
├── frontend/     ← React + Vite frontend
├── postman/      ← API collections
└── docker-compose.yml
```

## Running it locally

Each service runs in its own terminal. Start order: **ai-service → api → frontend** (the API tolerates the AI service being down; the frontend doesn't tolerate the API being down).

**ai-service** — Python FastAPI, port 8000
```powershell
cd ai-service
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**api** — NestJS, port 3000
```powershell
cd api
npm run start:dev
```

**frontend** — React + Vite, port 5173
```powershell
cd frontend
npm run dev
```

## Environment variables

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

## Stack

- **api/** — NestJS, Prisma, PostgreSQL, Passport JWT
- **ai-service/** — FastAPI, Anthropic SDK (tool use for structured output), ChromaDB, sympy
- **frontend/** — React, Vite, TanStack Query, React Router

See [CLAUDE.md](CLAUDE.md) for a full breakdown of modules, routes, schemas, and conventions.
