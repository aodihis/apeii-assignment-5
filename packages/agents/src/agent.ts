import { Agent, type Message } from "@anvia/core";
import { BASE_INSTRUCTIONS } from "./instructions";
import { getLens } from "./lens";
import { getModel, DEFAULT_MODEL_ID } from "./models";

export type RunAgentOptions = {
  messages: readonly Message[];
  modelId?: string;
  maxTurns?: number;
  abortSignal?: AbortSignal;
};

export async function runAgent(options: RunAgentOptions): Promise<string> {
  const agent = new Agent({
    id: "apeii-5-helper",
    model: getModel(options.modelId ?? DEFAULT_MODEL_ID),
    instructions: BASE_INSTRUCTIONS,
    maxTurns: options.maxTurns ?? 10,
    observability: {
      observers: { lens: getLens().observer({ captureMode: "full" }) },
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
