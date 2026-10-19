# Devscale AI Product Engineering: TypeScript VI

## Assignment 5

Assignment by Iqbal.

This assignment builds a hadith RAG agent: a chat assistant that answers questions about hadiths
(sayings and teachings of the Prophet Muhammad, peace be upon him) strictly from a retrieved,
cited source, and declines anything outside that scope. It uses TypeScript, Anvia Agent Core,
Qdrant as the vector store, Postgres (via Prisma) for conversation memory, Hono for the API, and a
TanStack Router + React frontend with a Claude/ChatGPT-style chat history sidebar.

## Requirements

- Node.js
- pnpm
- Docker
- An OpenAI-compatible API key and base URL (used for both the chat model and embeddings)

## Assignment Requirements

This project satisfies the assignment requirements by:

- Creating a RAG agent with one focused task: answer hadith questions from retrieved sources only.
- Giving it a `search_hadiths` vector search tool over a Qdrant collection of 100 hadiths.
- Citing every hadith used as `(Collection, Book N, Hadith N)`, quoting retrieved text rather than paraphrasing.
- Refusing fatwas/legal rulings and anything outside the hadith scope, with a fixed refusal reply.
- Persisting conversation history per session (Postgres/Prisma) and exposing it in the UI as chat history, like Claude or ChatGPT.
- Writing 20 eval cases against three metrics: `gEval()` correctness with a rubric, `answerRelevancy()`, and `contains()` with a regex that checks the reply actually cites a relevant hadith.

## Setup

Install dependencies:

```bash
pnpm install
```

Create a local environment file from the example:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
LLM_API_KEY=your-api-key
LLM_API_URL=https://openrouter.ai/api/v1
EMBEDDING_API_KEY=
EMBEDDING_API_URL=
EMBEDDING_MODEL_ID=openai/text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

`EMBEDDING_API_KEY`/`EMBEDDING_API_URL` are optional overrides — leave them blank to reuse
`LLM_API_KEY`/`LLM_API_URL` with a different model.

Start Postgres and Qdrant:

```bash
pnpm infra:up
```

Set up the database schema:

```bash
pnpm --filter @apeii-5/db run db:emit
pnpm --filter @apeii-5/db run db:init
```

Ingest the hadith collection into Qdrant:

```bash
pnpm ingest
```

## Run the Application

Start the API and the web app (in separate terminals):

```bash
pnpm dev:api
pnpm dev:web
```

The web app runs at `http://localhost:5173` by default and proxies `/api` to the API. The API
entry point is `apps/api/src/index.ts`; the agent itself lives in `packages/agents/src/agent.ts`.

## Available Tools

### Search Hadiths

`search_hadiths` runs a vector similarity search over the Qdrant collection and returns the most
relevant hadiths with their collection, book, and hadith number.

The tool returns no results when nothing is relevant, so the agent can reply with the fixed
"couldn't find related hadiths" message instead of guessing.

## How the Agent Works

The behavior is defined in `packages/agents/src/instructions.ts`:

1. Always call `search_hadiths` before answering — never rely on outside knowledge.
2. Answer only from what the tool returns, citing every hadith as `(Collection, Book N, Hadith N)`
   and quoting the retrieved English text rather than paraphrasing.
3. If the tool returns nothing relevant, reply with exactly: `"Sorry, we couldn't find related hadiths."`
4. If the question is outside hadiths, reply with exactly: `"Sorry, I can only answer questions about hadiths."`
5. Never issue personal rulings (fatwas) or legal interpretations — direct the user to a qualified scholar instead.

Conversation history is stored per session in Postgres through `@anvia/memory-prisma`, so a chat
can be reopened later from the sidebar with its full history intact.

## Qdrant Collections

The live hadith collection name comes from `QDRANT_COLLECTION` (see `.env.example`), defaulting to
`hadiths`. Evals always use a separate, hardcoded collection (`hadiths-eval`) so they can never read
from or write to the collection chat traffic uses.

Querying never creates a collection — only `pnpm ingest` does. If you point `QDRANT_COLLECTION` at
a collection that hasn't been ingested yet, the agent will run without error but get no search
results, so run the ingest script first after changing it.

## Eval Suites

Each suite lives in `packages/agents/src/evals/` and runs the real agent against the same 20 cases,
grounded in the eval-only hadith sample (`data/hadiths-eval.json`, Bukhari Book 3, Hadith 101-110):

| Suite | Metric |
| --- | --- |
| `correctness` | `gEval()` with a rubric comparing the reply's meaning to the expected hadith |
| `answer-relevancy` | `answerRelevancy()` |
| `contains` | `contains()` with a regex confirming the reply cites a relevant hadith number |

Before running evals, ingest the eval-only collection:

```bash
pnpm ingest:eval
```

## Run the Evals

Run all suites in order:

```bash
pnpm eval:hadith
```

Or run one suite:

```bash
pnpm --filter @apeii-5/agents run eval:correctness
pnpm --filter @apeii-5/agents run eval:answer-relevancy
pnpm --filter @apeii-5/agents run eval:contains
```

## Observability

Tracing to the self-hosted Anvia Lens stack is optional. Leave `ANVIA_LENS_BASE_URL`,
`ANVIA_LENS_PUBLIC_KEY`, and `ANVIA_LENS_SECRET_KEY` blank in `.env` to run with no observability at
all — the agent becomes a true no-op in that case. Lens itself has its own compose file and `.env`
under `infra/lens`, started with `pnpm lens:up`.
