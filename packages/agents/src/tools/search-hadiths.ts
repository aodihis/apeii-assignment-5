import { createVectorSearchTool } from "@anvia/core/vector-store";
import { getEmbeddingModel } from "../models";
import { getHadithStore, COLLECTIONS, type CollectionName } from "../store";

// The model can ask for more than this via the tool's own `topK` argument, so clamp
// the result below rather than relying on this as just a default.
const MAX_RESULTS = 3;

export function createSearchHadithsTool(collection: CollectionName = COLLECTIONS.data) {
  const tool = createVectorSearchTool({
    name: "search_hadiths",
    description: "Search the hadith collection. Returns the most relevant hadiths with their collection, book, and hadith number.",
    store: getHadithStore(collection),
    model: getEmbeddingModel(),
    topK: MAX_RESULTS,
  });

  return {
    ...tool,
    async call(args: { query: string; topK?: number }, context?: Parameters<typeof tool.call>[1]) {
      const results = await tool.call({ ...args, topK: Math.min(args.topK ?? MAX_RESULTS, MAX_RESULTS) }, context);
      return results.slice(0, MAX_RESULTS);
    },
  };
}
