import { Agent, type Message } from "@anvia/core";
import { getLens } from "@apeii-5/lens";
import { INSTRUCTIONS } from "./instructions";
import { getModel, DEFAULT_MODEL_ID } from "./models";
import { COLLECTIONS, type CollectionName } from "./store";
import { createSearchHadithsTool } from "./tools/search-hadiths";

export type RunAgentOptions = {
  messages: readonly Message[];
  collection?: CollectionName;
  modelId?: string;
  maxTurns?: number;
  abortSignal?: AbortSignal;
};

export async function runAgent(options: RunAgentOptions): Promise<string> {
  const agent = new Agent({
    id: "hadith-assistant",
    model: getModel(options.modelId ?? DEFAULT_MODEL_ID),
    instructions: INSTRUCTIONS,
    tools: [createSearchHadithsTool(options.collection ?? COLLECTIONS.data)],
    maxTurns: options.maxTurns ?? 10,
    observability: {
      observers: { lens: getLens("apeii-5-hadith-agent").observer({ captureMode: "full" }) },
      primaryTrace: "lens",
    },
  });

  const outcome = await agent.generate({
    messages: options.messages,
    abortSignal: options.abortSignal,
  });

  if (outcome.type !== "response") {
    throw new Error(`Agent run ended with "${outcome.type}" instead of a response.`);
  }

  return outcome.output;
}
