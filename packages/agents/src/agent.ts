import { Agent, type Message, type MemoryScope, type MemoryStore, type UserMessage } from "@anvia/core";
import { getLens } from "./lens";
import { INSTRUCTIONS } from "./instructions";
import { getModel, DEFAULT_MODEL_ID } from "./models";
import { COLLECTIONS, type CollectionName } from "./store";
import { createSearchHadithsTool } from "./tools/search-hadiths";

export type RunAgentOptions = {
  messages: readonly Message[];
  memory?: { store: MemoryStore; session: MemoryScope };
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
    memory: options.memory ? { store: options.memory.store, savePolicy: "turn" } : undefined,
    observability: {
      observers: { lens: getLens().observer({ captureMode: "full" }) },
      primaryTrace: "lens",
    },
  });

  // With memory, the store already holds earlier turns, so only the latest user message is sent.
  const outcome = options.memory
    ? await agent.generate({
        prompt: lastUserMessage(options.messages),
        session: options.memory.session,
        abortSignal: options.abortSignal,
      })
    : await agent.generate({ messages: options.messages, abortSignal: options.abortSignal });

  if (outcome.type !== "response") {
    throw new Error(`Agent run ended with "${outcome.type}" instead of a response.`);
  }

  return outcome.output;
}

function lastUserMessage(messages: readonly Message[]): UserMessage {
  const prompt = [...messages].reverse().find((m): m is UserMessage => m.role === "user");
  if (!prompt) throw new Error("runAgent needs at least one user message.");
  return prompt;
}
