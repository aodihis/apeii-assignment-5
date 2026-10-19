import {
  Agent,
  type AgentStream,
  type Message,
  type MemoryScope,
  type MemoryStore,
  type UserMessage,
} from "@anvia/core";
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

export function runAgent(options: RunAgentOptions): AgentStream<string> {
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

  if (options.memory) {
    // The memory store already holds earlier turns, so send only the latest user message.
    return agent.stream({
      prompt: lastUserMessage(options.messages),
      session: options.memory.session,
      abortSignal: options.abortSignal,
    });
  }

  return agent.stream({ messages: options.messages, abortSignal: options.abortSignal });
}

function lastUserMessage(messages: readonly Message[]): UserMessage {
  const prompt = [...messages].reverse().find((m): m is UserMessage => m.role === "user");
  if (!prompt) throw new Error("runAgent needs at least one user message.");
  return prompt;
}
