import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "@apeii-5/db";
import { PrismaMemoryStore } from "@anvia/memory-prisma/v8";
import type { Message } from "@anvia/core";
import { createChatRouter } from "./modules/chat/router";
import { hadithsRouter } from "./modules/hadiths/router";

const USER_ID = "default-user";

const memoryStore = new PrismaMemoryStore({ client: db });
await memoryStore.validate();

function scopeFor(sessionId: string) {
  return { sessionId, userId: USER_ID };
}

function firstUserText(messages: readonly { message: Message }[]): string | undefined {
  const first = messages.find((m) => m.message.role === "user")?.message;
  if (!first) return undefined;
  return typeof first.content === "string" ? first.content : first.content.find((p) => p.type === "text")?.text;
}

// Chained off one `new Hono()` so the exported AppType captures every route below for
// the frontend's typed `hc` client (see apps/web/src/lib/api-client.ts).
const app = new Hono()
  .use("*", cors())
  .get("/", (c) => c.json({ name: "apeii-5-api", status: "ok" }))
  .route("/chat", createChatRouter({ memoryStore, userId: USER_ID }))
  .route("/hadiths", hadithsRouter)
  .get("/sessions", async (c) => {
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
  })
  .get("/sessions/:id/messages", async (c) => {
    return c.json(await memoryStore.load({ scope: scopeFor(c.req.param("id")) }));
  });

const port = Number(process.env.API_PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

export type AppType = typeof app;
