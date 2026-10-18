import { serve } from "@hono/node-server";
import { runAgent } from "@apeii-5/agents";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import type { Message } from "@anvia/core";

const app = new Hono();

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
  const { messages } = c.req.valid("json");
  const reply = await runAgent({ messages: messages as Message[] });
  return c.json({ reply });
});

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

export type AppType = typeof app;
