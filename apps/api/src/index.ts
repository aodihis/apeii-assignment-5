import { serve } from "@hono/node-server";
import { runAgent } from "@apeii-5/agents";
import { agentToClientStream, parseClientStreamRequest } from "@anvia/client";
import { createClientStreamResponse } from "@anvia/server";
import { db } from "@apeii-5/db";
import { PrismaMemoryStore } from "@anvia/memory-prisma/v8";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Message } from "@anvia/core";

const app = new Hono();

const memoryStore = new PrismaMemoryStore({ client: db });
await memoryStore.validate();

const USER_ID = "default-user";

function scopeFor(sessionId: string) {
  return { sessionId, userId: USER_ID };
}

function firstUserText(messages: readonly { message: Message }[]): string | undefined {
  const first = messages.find((m) => m.message.role === "user")?.message;
  if (!first) return undefined;
  return typeof first.content === "string" ? first.content : first.content.find((p) => p.type === "text")?.text;
}

app.use("*", cors());

app.get("/", (c) => c.json({ name: "apeii-5-api", status: "ok" }));

app.post("/chat", async (c) => {
  const sessionId = c.req.query("sessionId");
  if (!sessionId) return c.text("sessionId query parameter is required.", 400);

  const body = parseClientStreamRequest(await c.req.json());
  if (body.type !== "messages") {
    return c.text("This endpoint accepts messages only.", 400);
  }
  const events = agentToClientStream({
    events: runAgent({
      messages: body.messages,
      memory: { store: memoryStore, session: scopeFor(sessionId) },
    }),
  });
  return createClientStreamResponse({ events });
});

app.get("/sessions", async (c) => {
  const inspector = memoryStore.inspector;
  if (!inspector) throw new Error("Memory store does not support listing sessions.");

  const conversations = await inspector.listConversations({ limit: 50, userId: USER_ID });
  const sessions = await Promise.all(
    conversations.map(async (summary) => {
      const conversation = await inspector.getConversation({ ref: summary.ref });
      return {
        id: summary.sessionId,
        updatedAt: summary.updatedAt,
        title: (conversation && firstUserText(conversation.messages)) ?? "New chat",
      };
    }),
  );
  sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return c.json(sessions);
});

app.get("/sessions/:id/messages", async (c) => {
  return c.json(await memoryStore.load({ scope: scopeFor(c.req.param("id")) }));
});

const port = Number(process.env.API_PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

export type AppType = typeof app;
