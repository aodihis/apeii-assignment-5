import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { runAgent } from "@apeii-5/agents";
import { agentToClientStream, parseClientStreamRequest } from "@anvia/client";
import { createClientStreamResponse } from "@anvia/server";
import type { MemoryStore } from "@anvia/core";
import { chatQuerySchema } from "./schema";
import { logger } from "../../logger";

// The request/response bodies here are a streaming ndjson protocol owned by
// @anvia/client/@anvia/server (parseClientStreamRequest/createClientStreamResponse),
// not a plain JSON contract, so only the query string goes through zod - the body
// already validates and types itself through that protocol.
export function createChatRouter(deps: { memoryStore: MemoryStore; userId: string }) {
  return new Hono().post("/", zValidator("query", chatQuerySchema), async (c) => {
    const { sessionId } = c.req.valid("query");

    const body = parseClientStreamRequest(await c.req.json());
    if (body.type !== "messages") {
      logger.warn("chat request rejected: not a messages request", { sessionId, bodyType: body.type });
      return c.text("This endpoint accepts messages only.", 400);
    }

    logger.debug("chat turn started", { sessionId, messageCount: body.messages.length });
    const events = agentToClientStream({
      events: runAgent({
        messages: body.messages,
        memory: { store: deps.memoryStore, session: { sessionId, userId: deps.userId } },
      }),
    });
    return createClientStreamResponse({ events });
  });
}
