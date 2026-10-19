# apeii-assignment-5

## Qdrant collections

The live hadith collection name comes from `QDRANT_COLLECTION` (see `.env.example`), defaulting to
`hadiths`. Evals always use a separate, hardcoded collection (`hadiths-eval`) so they can never read
from or write to the collection chat traffic uses.

Querying never creates a collection — only `pnpm --filter @apeii-5/agents run ingest` does. If you
point `QDRANT_COLLECTION` at a collection that hasn't been ingested yet, the agent will run without
error but get no search results, so run the ingest script first after changing it.
