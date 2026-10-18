import { QdrantVectorClient } from "@anvia/qdrant";
import type { TextDocument } from "@anvia/core/documents";
import { EMBEDDING_DIMENSIONS } from "./models";
import type { HadithMetadata } from "./hadith";

export const COLLECTIONS = {
  data: "hadiths",
  eval: "hadiths-eval",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

let client: QdrantVectorClient | undefined;

export function getQdrantClient(): QdrantVectorClient {
  if (!client) {
    client = new QdrantVectorClient({ url: process.env.QDRANT_URL ?? "http://localhost:6333" });
  }
  return client;
}

export function getHadithStore(collectionName: CollectionName) {
  return getQdrantClient().vectorStore<TextDocument<HadithMetadata>, HadithMetadata>({
    collectionName,
    dimensions: EMBEDDING_DIMENSIONS,
    metric: "cosine",
  });
}
