import { createVectorSearchTool } from "@anvia/core/vector-store";
import { getEmbeddingModel } from "../models";
import { getHadithStore, COLLECTIONS, type CollectionName } from "../store";

export function createSearchHadithsTool(collection: CollectionName = COLLECTIONS.data) {
  return createVectorSearchTool({
    name: "search_hadiths",
    description: "Search the hadith collection. Returns the most relevant hadiths with their collection, book, and hadith number.",
    store: getHadithStore(collection),
    model: getEmbeddingModel(),
    topK: 3,
  });
}
