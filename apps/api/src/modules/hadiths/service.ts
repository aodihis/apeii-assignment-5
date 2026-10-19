import { QdrantVectorClient } from "@anvia/qdrant";
import type { Hadith } from "./schema";

// Deliberately independent from packages/agents' store.ts: that one builds a VectorStore
// for the agent's embedding search (search_hadiths), a different domain from this - a
// plain point-by-id lookup for the frontend's hadith detail panel. No embedding model,
// no search, so it gets its own client and its own collection handle instead of reusing
// the agent's.
let client: QdrantVectorClient | undefined;

function getClient(): QdrantVectorClient {
  if (!client) {
    client = new QdrantVectorClient({ url: process.env.QDRANT_URL ?? "http://localhost:6333" });
  }
  return client;
}

type HadithMetadataShape = NonNullable<Hadith["metadata"]>;

const store = getClient().vectorStore<{ id: string; text: string }, HadithMetadataShape>({
  collectionName: process.env.QDRANT_COLLECTION ?? "hadiths",
  dimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? 1536),
  metric: "cosine",
});

export async function getHadithById(id: string): Promise<Hadith | undefined> {
  const [item] = await store.get({ documentIds: [id] });
  if (!item) return undefined;
  return { id: item.id, text: item.document.text, metadata: item.metadata };
}
