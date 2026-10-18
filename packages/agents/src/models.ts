import { OpenAIClient } from "@anvia/openai";

// Canonical OpenRouter model ID (LLM_API_URL defaults to OpenRouter's endpoint).
export const DEFAULT_MODEL_ID = "openai/gpt-6-luna";
export const EMBEDDING_MODEL_ID = process.env.EMBEDDING_MODEL_ID ?? "openai/text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS ?? 1536);

let client: OpenAIClient | undefined;
let embeddingClient: OpenAIClient | undefined;

function getClient(): OpenAIClient {
  if (!client) {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) throw new Error("Set LLM_API_KEY.");
    const baseUrl = process.env.LLM_API_URL;
    if (!baseUrl) throw new Error("Set LLM_API_URL.");
    client = new OpenAIClient({ apiKey, baseUrl });
  }
  return client;
}

// Separate credentials so the embedding provider can differ from the chat LLM.
// Falls back to LLM_API_KEY/LLM_API_URL when EMBEDDING_API_KEY/EMBEDDING_API_URL are unset.
function getEmbeddingClient(): OpenAIClient {
  if (!embeddingClient) {
    const apiKey = process.env.EMBEDDING_API_KEY ?? process.env.LLM_API_KEY;
    if (!apiKey) throw new Error("Set EMBEDDING_API_KEY (or LLM_API_KEY).");
    const baseUrl = process.env.EMBEDDING_API_URL ?? process.env.LLM_API_URL;
    if (!baseUrl) throw new Error("Set EMBEDDING_API_URL (or LLM_API_URL).");
    embeddingClient = new OpenAIClient({ apiKey, baseUrl });
  }
  return embeddingClient;
}

export function getModel(modelId: string = DEFAULT_MODEL_ID) {
  return getClient().completionModel({ modelId, api: "chat" });
}

export function getEmbeddingModel(modelId: string = EMBEDDING_MODEL_ID) {
  return getEmbeddingClient().embeddingModel({ modelId, dimensions: EMBEDDING_DIMENSIONS });
}
