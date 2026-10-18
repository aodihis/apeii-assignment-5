import { serve } from "@hono/node-server";
import { runAgent } from "@apeii-5/agents";
import { db } from "@apeii-5/db";
import { PrismaMemoryStore } from "@anvia/memory-prisma/v8";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
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

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

app.post("/chat", zValidator("json", chatSchema), async (c) => {
  const sessionId = c.req.query("sessionId");
  const { messages } = c.req.valid("json");

  const reply = await runAgent({
    messages: messages as Message[],
    memory: sessionId ? { store: memoryStore, session: scopeFor(sessionId) } : undefined,
  });

  return c.json({ reply });
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

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

export type AppType = typeof app;
