import { OpenAIClient } from "@anvia/openai";

// Canonical OpenRouter model ID (LLM_API_URL defaults to OpenRouter's endpoint).
export const DEFAULT_MODEL_ID = "openai/gpt-6-luna";

let client: OpenAIClient | undefined;

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

export function getModel(modelId: string = DEFAULT_MODEL_ID) {
  return getClient().completionModel({ modelId, api: "chat" });
}
