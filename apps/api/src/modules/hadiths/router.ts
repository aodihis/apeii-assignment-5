import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { hadithIdParamSchema } from "./schema";
import { getHadithById } from "./service";

// Looked up by the agent-cited id in a hadith citation link, to show its full text in
// the frontend's slide-over panel.
export const hadithsRouter = new Hono().get("/:id", zValidator("param", hadithIdParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const hadith = await getHadithById(id);
  if (!hadith) return c.json({ error: "Hadith not found" as const }, 404);
  return c.json(hadith, 200);
});
