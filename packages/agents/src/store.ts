import { ChromaVectorClient } from "@anvia/chroma";
import type { TextDocument } from "@anvia/core/documents";
import { EMBEDDING_DIMENSIONS } from "./models";
import type { HadithMetadata } from "./hadith";

export const COLLECTIONS = {
  data: "hadiths",
  eval: "hadiths-eval",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

let client: ChromaVectorClient | undefined;

export function getChromaClient(): ChromaVectorClient {
  if (!client) {
    client = new ChromaVectorClient({ path: process.env.CHROMA_URL ?? "http://localhost:8000" });
  }
  return client;
}

export function getHadithStore(collectionName: CollectionName) {
  return getChromaClient().vectorStore<TextDocument<HadithMetadata>, HadithMetadata>({
    collectionName,
    dimensions: EMBEDDING_DIMENSIONS,
    metric: "cosine",
  });
}
