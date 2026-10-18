import { ingestVectorDocuments } from "@anvia/core/vector-store";
import { loadHadiths, toDocuments } from "../hadith";
import { getEmbeddingModel } from "../models";
import { getChromaClient, getHadithStore, COLLECTIONS, type CollectionName } from "../store";

const target = process.argv[2] ?? "data";
if (target !== "data" && target !== "eval") {
  console.error(`Unknown target "${target}". Use "data" or "eval".`);
  process.exit(1);
}

const collectionName: CollectionName = COLLECTIONS[target];
const dataPath = new URL(`../../../../data/hadiths${target === "eval" ? "-eval" : ""}.json`, import.meta.url);

try {
  const hadiths = await loadHadiths(dataPath);
  const store = getHadithStore(collectionName);
  await store.ensure();

  const { documents } = await ingestVectorDocuments({
    store,
    documents: toDocuments(hadiths),
    embeddingModel: getEmbeddingModel(),
    chunking: { strategy: "none" },
  });

  console.log(`Ingested ${documents.length} hadiths into collection "${collectionName}".`);
} finally {
  await getChromaClient().close();
}
